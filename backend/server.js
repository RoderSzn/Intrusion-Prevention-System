const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config();

const { initDatabase } = require('./database/db');
const ipsMiddleware = require('./middleware/ipsMiddleware');
const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');
const logger = require('./services/logger');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Morgan HTTP request logger
app.use(morgan('combined', { 
  stream: { 
    write: message => logger.info(message.trim()) 
  } 
}));

// Make Socket.IO accessible to routes
app.set('io', io);

// Apply IPS middleware to all routes except admin
app.use(ipsMiddleware(io));

// Apply rate limiting to API routes
app.use('/api', rateLimiter);

// Routes
app.use('/api', apiRoutes);
app.use('/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'IPS API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      admin: '/admin'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling middleware
app.use(errorHandler);

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  socket.emit('welcome', { 
    message: 'Connected to IPS Server',
    timestamp: new Date().toISOString()
  });
  
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
  
  socket.on('error', (error) => {
    logger.error(`Socket error for ${socket.id}: ${error.message}`);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Initialize database and start server
initDatabase()
  .then(() => {
    server.listen(PORT, () => {
      logger.info(`IPS Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      console.log('\n🛡️  ====================================');
      console.log('   IPS Server Started Successfully!');
      console.log('   ====================================');
      console.log(`   🌐 Server URL: http://localhost:${PORT}`);
      console.log(`   🔧 Environment: ${process.env.NODE_ENV}`);
      console.log(`   📊 API Docs: http://localhost:${PORT}/`);
      console.log(`   ❤️  Health Check: http://localhost:${PORT}/health`);
      console.log('   ====================================\n');
    });
  })
  .catch(err => {
    logger.error(`Failed to initialize database: ${err.message}`);
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  });

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

module.exports = { app, server, io };