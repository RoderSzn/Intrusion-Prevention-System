const threatDetector = require('../services/threatDetector');
const alertService = require('../services/alertService');
const logger = require('../services/logger');

/**
 * IPS Middleware - Analyzes all incoming requests for threats
 */
module.exports = (io) => {
  return (req, res, next) => {
    // Skip IPS scanning for specific endpoints
    const skipPaths = ['/health', '/admin', '/socket.io'];
    if (skipPaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Analyze request for threats
    const analysis = threatDetector.analyze(req);

    if (analysis.detected) {
      // Log the threat
      threatDetector.logThreat(analysis.threat);
      threatDetector.updateStatistics(true);
      
      // Emit real-time threat notification via Socket.IO
      io.emit('threat-detected', analysis.threat);
      
      // Send alert if necessary
      alertService.notifyThreat(analysis.threat);
      
      // Log the block
      logger.warn(`🚫 THREAT BLOCKED: ${analysis.threat.threat_type} from ${analysis.threat.source_ip} - ${req.method} ${req.path}`);
      
      // Return 403 Forbidden
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Security threat detected and blocked by Intrusion Prevention System',
        threat_id: analysis.threat.id,
        threat_type: analysis.threat.threat_type,
        severity: analysis.threat.severity,
        timestamp: analysis.threat.timestamp
      });
    }

    // No threat detected - allow request
    threatDetector.updateStatistics(false);
    threatDetector.trackIP(threatDetector.getClientIP(req), false);
    
    next();
  };
};