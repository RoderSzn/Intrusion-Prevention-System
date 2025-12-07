const rateLimit = require('express-rate-limit');
const logger = require('../services/logger');

/**
 * Rate limiter middleware to prevent brute force attacks
 */
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes default
  max: process.env.RATE_LIMIT_MAX || 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests from this IP address. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
    });
  },
  skip: (req) => {
    // Skip rate limiting for admin endpoints
    return req.path.startsWith('/admin');
  }
});

module.exports = limiter;