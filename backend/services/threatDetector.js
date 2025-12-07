const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database/db');
const logger = require('./logger');

class ThreatDetector {
  constructor() {
    this.rules = [];
    this.loadRules();
  }

  /**
   * Load detection rules from database
   */
  loadRules() {
    const db = getDb();
    db.all('SELECT * FROM rules WHERE enabled = 1', [], (err, rows) => {
      if (err) {
        logger.error(`Failed to load rules: ${err.message}`);
        return;
      }
      
      this.rules = rows.map(rule => ({
        ...rule,
        pattern: new RegExp(rule.pattern, 'i')
      }));
      
      logger.info(`Loaded ${this.rules.length} active detection rules`);
    });
  }

  /**
   * Analyze incoming request for threats
   */
  analyze(req) {
    // Combine all request data for analysis
    const payload = JSON.stringify({
      body: req.body,
      query: req.query,
      params: req.params,
      path: req.path,
      headers: {
        'user-agent': req.headers['user-agent'],
        'referer': req.headers['referer']
      }
    });

    // Test against each rule
    for (const rule of this.rules) {
      if (rule.pattern.test(payload)) {
        const threat = {
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          source_ip: this.getClientIP(req),
          threat_type: rule.name,
          severity: rule.severity,
          request_method: req.method,
          request_path: req.path,
          payload: payload.substring(0, 1000), // Limit payload size
          user_agent: req.headers['user-agent'] || 'Unknown',
          status: 'blocked',
          rule_id: rule.id
        };

        return {
          detected: true,
          rule: rule,
          threat: threat
        };
      }
    }

    return { detected: false };
  }

  /**
   * Get client IP address
   */
  getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
           req.headers['x-real-ip'] ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           req.ip ||
           'Unknown';
  }

  /**
   * Log detected threat to database
   */
  logThreat(threat) {
    const db = getDb();
    
    db.run(`
      INSERT INTO threats (
        id, timestamp, source_ip, threat_type, severity, 
        request_method, request_path, payload, user_agent, status, rule_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      threat.id,
      threat.timestamp,
      threat.source_ip,
      threat.threat_type,
      threat.severity,
      threat.request_method,
      threat.request_path,
      threat.payload,
      threat.user_agent,
      threat.status,
      threat.rule_id
    ], (err) => {
      if (err) {
        logger.error(`Failed to log threat: ${err.message}`);
      } else {
        logger.info(`Threat logged: ${threat.id}`);
      }
    });

    // Update rule blocked count
    db.run(`
      UPDATE rules 
      SET blocked_count = blocked_count + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [threat.rule_id], (err) => {
      if (err) {
        logger.error(`Failed to update rule count: ${err.message}`);
      }
    });

    // Track IP
    this.trackIP(threat.source_ip, true);
  }

  /**
   * Track IP address activity
   */
  trackIP(ipAddress, isThreat = false) {
    const db = getDb();
    
    db.run(`
      INSERT INTO ip_tracking (ip_address, request_count, threat_count, last_seen)
      VALUES (?, 1, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(ip_address) DO UPDATE SET
        request_count = request_count + 1,
        threat_count = threat_count + ?,
        last_seen = CURRENT_TIMESTAMP,
        status = CASE 
          WHEN threat_count + ? > 10 THEN 'blocked'
          WHEN threat_count + ? > 5 THEN 'suspicious'
          ELSE status
        END
    `, [ipAddress, isThreat ? 1 : 0, isThreat ? 1 : 0, isThreat ? 1 : 0, isThreat ? 1 : 0]);
  }

  /**
   * Update daily statistics
   */
  updateStatistics(blocked = false) {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];

    db.run(`
      INSERT INTO statistics (date, total_requests, blocked_requests, allowed_requests)
      VALUES (?, 1, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        total_requests = total_requests + 1,
        blocked_requests = blocked_requests + ?,
        allowed_requests = allowed_requests + ?
    `, [
      today, 
      blocked ? 1 : 0, 
      blocked ? 0 : 1, 
      blocked ? 1 : 0, 
      blocked ? 0 : 1
    ], (err) => {
      if (err) {
        logger.error(`Failed to update statistics: ${err.message}`);
      }
    });
  }
}

module.exports = new ThreatDetector();