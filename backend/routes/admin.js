const express = require('express');
const router = express.Router();
const { getDb } = require('../database/db');
const threatDetector = require('../services/threatDetector');
const alertService = require('../services/alertService');
const logger = require('../services/logger');

/**
 * Admin API endpoints for IPS management
 * Note: In production, these should be protected with authentication
 */

// GET /admin/threats - Get all threats
router.get('/threats', (req, res) => {
  const db = getDb();
  const limit = parseInt(req.query.limit) || 100;
  const offset = parseInt(req.query.offset) || 0;
  const severity = req.query.severity;
  
  let query = 'SELECT * FROM threats';
  let params = [];
  
  if (severity) {
    query += ' WHERE severity = ?';
    params.push(severity);
  }
  
  query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  
  db.all(query, params, (err, rows) => {
    if (err) {
      logger.error(`Failed to fetch threats: ${err.message}`);
      return res.status(500).json({ error: err.message });
    }
    
    // Get total count
    db.get('SELECT COUNT(*) as total FROM threats', [], (err, countRow) => {
      if (err) {
        logger.error(`Failed to count threats: ${err.message}`);
        return res.status(500).json({ error: err.message });
      }
      
      res.json({ 
        threats: rows,
        total: countRow.total,
        limit,
        offset
      });
    });
  });
});

// GET /admin/threats/:id - Get specific threat
router.get('/threats/:id', (req, res) => {
  const db = getDb();
  const { id } = req.params;
  
  db.get('SELECT * FROM threats WHERE id = ?', [id], (err, row) => {
    if (err) {
      logger.error(`Failed to fetch threat: ${err.message}`);
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Threat not found' });
    }
    
    res.json({ threat: row });
  });
});

// DELETE /admin/threats - Clear all threats
router.delete('/threats', (req, res) => {
  const db = getDb();
  
  db.run('DELETE FROM threats', [], function(err) {
    if (err) {
      logger.error(`Failed to clear threats: ${err.message}`);
      return res.status(500).json({ error: err.message });
    }
    
    logger.info(`Cleared ${this.changes} threats`);
    res.json({ 
      message: 'All threats cleared',
      deleted: this.changes 
    });
  });
});

// GET /admin/statistics - Get system statistics
router.get('/statistics', (req, res) => {
  const db = getDb();
  const days = parseInt(req.query.days) || 30;
  
  // Get total statistics
  db.get(`
    SELECT 
      SUM(total_requests) as total_requests,
      SUM(blocked_requests) as blocked_requests,
      SUM(allowed_requests) as allowed_requests
    FROM statistics
    WHERE date >= date('now', '-${days} days')
  `, [], (err, totals) => {
    if (err) {
      logger.error(`Failed to fetch statistics: ${err.message}`);
      return res.status(500).json({ error: err.message });
    }
    
    // Get daily statistics
    db.all(`
      SELECT * FROM statistics
      WHERE date >= date('now', '-${days} days')
      ORDER BY date DESC
    `, [], (err, daily) => {
      if (err) {
        logger.error(`Failed to fetch daily statistics: ${err.message}`);
        return res.status(500).json({ error: err.message });
      }
      
      // Check thresholds
      alertService.checkThresholds(totals || {});
      
      res.json({ 
        statistics: totals || { total_requests: 0, blocked_requests: 0, allowed_requests: 0 },
        daily: daily || [],
        period_days: days
      });
    });
  });
});

// GET /admin/rules - Get all detection rules
router.get('/rules', (req, res) => {
  const db = getDb();
  
  db.all('SELECT * FROM rules ORDER BY severity DESC, id ASC', [], (err, rows) => {
    if (err) {
      logger.error(`Failed to fetch rules: ${err.message}`);
      return res.status(500).json({ error: err.message });
    }
    
    res.json({ rules: rows });
  });
});

// GET /admin/rules/:id - Get specific rule
router.get('/rules/:id', (req, res) => {
  const db = getDb();
  const { id } = req.params;
  
  db.get('SELECT * FROM rules WHERE id = ?', [id], (err, row) => {
    if (err) {
      logger.error(`Failed to fetch rule: ${err.message}`);
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    
    res.json({ rule: row });
  });
});

// PATCH /admin/rules/:id/toggle - Toggle rule enabled status
router.patch('/rules/:id/toggle', (req, res) => {
  const db = getDb();
  const { id } = req.params;
  
  db.run(`
    UPDATE rules 
    SET enabled = NOT enabled, 
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [id], function(err) {
    if (err) {
      logger.error(`Failed to toggle rule: ${err.message}`);
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    
    // Reload rules in threat detector
    threatDetector.loadRules();
    
    logger.info(`Rule ${id} toggled`);
    res.json({ 
      message: 'Rule status toggled',
      changes: this.changes 
    });
  });
});

// PUT /admin/rules/:id - Update rule
router.put('/rules/:id', (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const { name, description, pattern, severity } = req.body;
  
  db.run(`
    UPDATE rules 
    SET name = ?, description = ?, pattern = ?, severity = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [name, description, pattern, severity, id], function(err) {
    if (err) {
      logger.error(`Failed to update rule: ${err.message}`);
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    
    // Reload rules in threat detector
    threatDetector.loadRules();
    
    logger.info(`Rule ${id} updated`);
    res.json({ 
      message: 'Rule updated successfully',
      changes: this.changes 
    });
  });
});

// POST /admin/rules - Create new rule
router.post('/rules', (req, res) => {
  const db = getDb();
  const { name, description, pattern, severity } = req.body;
  
  if (!name || !pattern || !severity) {
    return res.status(400).json({ error: 'Name, pattern, and severity are required' });
  }
  
  db.run(`
    INSERT INTO rules (name, description, pattern, severity)
    VALUES (?, ?, ?, ?)
  `, [name, description, pattern, severity], function(err) {
    if (err) {
      logger.error(`Failed to create rule: ${err.message}`);
      return res.status(500).json({ error: err.message });
    }
    
    // Reload rules in threat detector
    threatDetector.loadRules();
    
    logger.info(`New rule created: ${name}`);
    res.status(201).json({ 
      message: 'Rule created successfully',
      id: this.lastID 
    });
  });
});

// DELETE /admin/rules/:id - Delete rule
router.delete('/rules/:id', (req, res) => {
  const db = getDb();
  const { id } = req.params;
  
  db.run('DELETE FROM rules WHERE id = ?', [id], function(err) {
    if (err) {
      logger.error(`Failed to delete rule: ${err.message}`);
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    
    // Reload rules in threat detector
    threatDetector.loadRules();
    
    logger.info(`Rule ${id} deleted`);
    res.json({ 
      message: 'Rule deleted successfully',
      deleted: this.changes 
    });
  });
});

// GET /admin/ip-tracking - Get tracked IPs
router.get('/ip-tracking', (req, res) => {
  const db = getDb();
  const status = req.query.status;
  
  let query = 'SELECT * FROM ip_tracking';
  let params = [];
  
  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY threat_count DESC, last_seen DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      logger.error(`Failed to fetch IP tracking: ${err.message}`);
      return res.status(500).json({ error: err.message });
    }
    
    res.json({ ips: rows });
  });
});

// GET /admin/dashboard - Get dashboard summary
router.get('/dashboard', (req, res) => {
  const db = getDb();
  
  // Get today's statistics
  const today = new Date().toISOString().split('T')[0];
  
  db.get(`
    SELECT * FROM statistics WHERE date = ?
  `, [today], (err, todayStats) => {
    if (err) {
      logger.error(`Failed to fetch today's statistics: ${err.message}`);
      return res.status(500).json({ error: err.message });
    }
    
    // Get recent threats
    db.all(`
      SELECT * FROM threats 
      ORDER BY timestamp DESC 
      LIMIT 10
    `, [], (err, recentThreats) => {
      if (err) {
        logger.error(`Failed to fetch recent threats: ${err.message}`);
        return res.status(500).json({ error: err.message });
      }
      
      // Get rule statistics
      db.all(`
        SELECT name, severity, blocked_count, enabled 
        FROM rules 
        ORDER BY blocked_count DESC 
        LIMIT 10
      `, [], (err, topRules) => {
        if (err) {
          logger.error(`Failed to fetch rule statistics: ${err.message}`);
          return res.status(500).json({ error: err.message });
        }
        
        res.json({
          today: todayStats || { total_requests: 0, blocked_requests: 0, allowed_requests: 0 },
          recent_threats: recentThreats,
          top_rules: topRules,
          timestamp: new Date().toISOString()
        });
      });
    });
  });
});

module.exports = router;