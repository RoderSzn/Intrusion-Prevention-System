const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const logger = require('../services/logger');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'ips.db');
const dbDir = path.dirname(dbPath);

// Ensure database directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  logger.info(`Created database directory: ${dbDir}`);
}

// Initialize database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    logger.error(`Database connection error: ${err.message}`);
  } else {
    logger.info(`Connected to SQLite database: ${dbPath}`);
  }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

/**
 * Initialize database schema
 */
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create threats table
      db.run(`
        CREATE TABLE IF NOT EXISTS threats (
          id TEXT PRIMARY KEY,
          timestamp TEXT NOT NULL,
          source_ip TEXT NOT NULL,
          threat_type TEXT NOT NULL,
          severity TEXT NOT NULL CHECK(severity IN ('low', 'medium', 'high', 'critical')),
          request_method TEXT,
          request_path TEXT,
          payload TEXT,
          user_agent TEXT,
          status TEXT DEFAULT 'blocked' CHECK(status IN ('blocked', 'allowed', 'flagged')),
          rule_id INTEGER,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (rule_id) REFERENCES rules(id)
        )
      `, (err) => {
        if (err) {
          logger.error(`Failed to create threats table: ${err.message}`);
          return reject(err);
        }
        logger.info('Threats table ready');
      });

      // Create index on timestamp for faster queries
      db.run(`
        CREATE INDEX IF NOT EXISTS idx_threats_timestamp 
        ON threats(timestamp DESC)
      `);

      db.run(`
        CREATE INDEX IF NOT EXISTS idx_threats_severity 
        ON threats(severity)
      `);

      // Create rules table
      db.run(`
        CREATE TABLE IF NOT EXISTS rules (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          pattern TEXT NOT NULL,
          severity TEXT NOT NULL CHECK(severity IN ('low', 'medium', 'high', 'critical')),
          enabled INTEGER DEFAULT 1 CHECK(enabled IN (0, 1)),
          blocked_count INTEGER DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          logger.error(`Failed to create rules table: ${err.message}`);
          return reject(err);
        }
        logger.info('Rules table ready');
      });

      // Create statistics table
      db.run(`
        CREATE TABLE IF NOT EXISTS statistics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT NOT NULL UNIQUE,
          total_requests INTEGER DEFAULT 0,
          blocked_requests INTEGER DEFAULT 0,
          allowed_requests INTEGER DEFAULT 0,
          unique_ips INTEGER DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          logger.error(`Failed to create statistics table: ${err.message}`);
          return reject(err);
        }
        logger.info('Statistics table ready');
      });

      // Create IP tracking table
      db.run(`
        CREATE TABLE IF NOT EXISTS ip_tracking (
          ip_address TEXT PRIMARY KEY,
          request_count INTEGER DEFAULT 0,
          threat_count INTEGER DEFAULT 0,
          first_seen TEXT DEFAULT CURRENT_TIMESTAMP,
          last_seen TEXT DEFAULT CURRENT_TIMESTAMP,
          status TEXT DEFAULT 'normal' CHECK(status IN ('normal', 'suspicious', 'blocked'))
        )
      `, (err) => {
        if (err) {
          logger.error(`Failed to create ip_tracking table: ${err.message}`);
          return reject(err);
        }
        logger.info('IP tracking table ready');
      });

      // Insert default detection rules
      const defaultRules = [
        {
          name: 'SQL Injection',
          description: 'Detects SQL injection attempts including UNION, OR statements, and DROP commands',
          pattern: '(\\bOR\\b.*=.*|UNION.*SELECT|DROP.*TABLE|INSERT.*INTO|DELETE.*FROM|UPDATE.*SET|EXEC\\(|EXECUTE\\()',
          severity: 'high'
        },
        {
          name: 'XSS Attack',
          description: 'Detects cross-site scripting attempts with script tags and event handlers',
          pattern: '(<script.*?>.*?</script>|javascript:|onerror=|onload=|onclick=|<iframe|eval\\()',
          severity: 'high'
        },
        {
          name: 'Path Traversal',
          description: 'Detects directory traversal attempts using ../ patterns',
          pattern: '(\\.\\.\\/|\\.\\.\\\\.)',
          severity: 'medium'
        },
        {
          name: 'Command Injection',
          description: 'Detects attempts to inject shell commands',
          pattern: '([;&|`$(){}\\[\\]]|\\b(cat|ls|wget|curl|nc|bash|sh)\\b)',
          severity: 'high'
        },
        {
          name: 'LDAP Injection',
          description: 'Detects LDAP injection attempts',
          pattern: '(\\(\\||\\(\\&|\\*\\)|\\(\\!)',
          severity: 'medium'
        },
        {
          name: 'XML Injection',
          description: 'Detects XML/XXE injection attempts',
          pattern: '(<!ENTITY|<!DOCTYPE|SYSTEM|PUBLIC)',
          severity: 'high'
        },
        {
          name: 'NoSQL Injection',
          description: 'Detects NoSQL injection patterns',
          pattern: '(\\$ne|\\$gt|\\$lt|\\$or|\\$and|\\$where)',
          severity: 'medium'
        },
        {
          name: 'File Upload Attack',
          description: 'Detects suspicious file extensions',
          pattern: '\\.(exe|bat|sh|php|asp|aspx|jsp|py)$',
          severity: 'high'
        }
      ];

      const stmt = db.prepare(`
        INSERT OR IGNORE INTO rules (name, description, pattern, severity)
        VALUES (?, ?, ?, ?)
      `);

      let insertedCount = 0;
      defaultRules.forEach((rule, index) => {
        stmt.run([rule.name, rule.description, rule.pattern, rule.severity], (err) => {
          if (err) {
            logger.error(`Failed to insert rule ${rule.name}: ${err.message}`);
          } else {
            insertedCount++;
          }
          
          if (index === defaultRules.length - 1) {
            stmt.finalize((err) => {
              if (err) {
                logger.error(`Failed to finalize statement: ${err.message}`);
                reject(err);
              } else {
                logger.info(`Inserted ${insertedCount} default rules`);
                resolve();
              }
            });
          }
        });
      });
    });
  });
};

/**
 * Get database instance
 */
const getDb = () => db;

/**
 * Close database connection
 */
const closeDb = () => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        logger.error(`Error closing database: ${err.message}`);
        reject(err);
      } else {
        logger.info('Database connection closed');
        resolve();
      }
    });
  });
};

module.exports = { 
  initDatabase, 
  getDb, 
  closeDb 
};