const logger = require('./logger');

class AlertService {
  constructor() {
    this.alertThreshold = {
      low: 5,
      medium: 10,
      high: 20,
      critical: 50
    };
    this.alertsSent = new Map();
  }

  /**
   * Check threat thresholds and send alerts
   */
  checkThresholds(stats) {
    const blockedCount = stats.blocked_requests || 0;
    
    if (blockedCount >= this.alertThreshold.critical) {
      this.sendAlert('CRITICAL', `Critical threat level reached: ${blockedCount} attacks blocked today`);
    } else if (blockedCount >= this.alertThreshold.high) {
      this.sendAlert('HIGH', `High threat level: ${blockedCount} attacks blocked today`);
    } else if (blockedCount >= this.alertThreshold.medium) {
      this.sendAlert('MEDIUM', `Moderate threat level: ${blockedCount} attacks blocked today`);
    }
  }

  /**
   * Send alert notification
   */
  sendAlert(level, message) {
    const alertKey = `${level}-${new Date().toDateString()}`;
    
    // Prevent duplicate alerts for the same level on the same day
    if (this.alertsSent.has(alertKey)) {
      return;
    }

    this.alertsSent.set(alertKey, true);
    
    logger.warn(`[ALERT ${level}] ${message}`);
    console.log(`\n🚨 ================== SECURITY ALERT ==================`);
    console.log(`   Level: ${level}`);
    console.log(`   Message: ${message}`);
    console.log(`   Time: ${new Date().toISOString()}`);
    console.log(`=======================================================\n`);

    // TODO: Integrate with external notification services
    // - Email (Nodemailer)
    // - SMS (Twilio)
    // - Slack/Discord webhooks
    // - PagerDuty
  }

  /**
   * Send immediate threat notification
   */
  notifyThreat(threat) {
    if (threat.severity === 'high' || threat.severity === 'critical') {
      logger.warn(`High-severity threat detected from ${threat.source_ip}: ${threat.threat_type}`);
      
      // TODO: Send immediate notifications for high-severity threats
    }
  }

  /**
   * Clear old alerts (called periodically)
   */
  clearOldAlerts() {
    const today = new Date().toDateString();
    for (const [key] of this.alertsSent) {
      if (!key.endsWith(today)) {
        this.alertsSent.delete(key);
      }
    }
  }
}

module.exports = new AlertService();