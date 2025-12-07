const logger = require('../services/logger');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error(`Error: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // Default error status
  const statusCode = err.statusCode || 500;
  
  // Prepare error response
  const errorResponse = {
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.path = req.path;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;