const express = require('express');
const router = express.Router();
const logger = require('../services/logger');

/**
 * Test API endpoints for demonstration
 * These endpoints are protected by the IPS middleware
 */

// GET /api/users - List users
router.get('/users', (req, res) => {
  logger.info('GET /api/users');
  res.json({ 
    users: [
      { id: 1, name: 'Alice Johnson', email: 'alice@example.com' },
      { id: 2, name: 'Bob Smith', email: 'bob@example.com' },
      { id: 3, name: 'Charlie Brown', email: 'charlie@example.com' }
    ],
    total: 3
  });
});

// POST /api/login - User login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  logger.info(`POST /api/login - Username: ${username}`);
  
  // Simulate login (not a real authentication system)
  if (username && password) {
    res.json({ 
      message: 'Login successful',
      username,
      token: 'demo-token-' + Date.now()
    });
  } else {
    res.status(400).json({ error: 'Username and password required' });
  }
});

// GET /api/search - Search endpoint
router.get('/search', (req, res) => {
  const { q } = req.query;
  logger.info(`GET /api/search - Query: ${q}`);
  
  res.json({ 
    query: q,
    results: [
      { id: 1, title: 'Result 1', description: 'First search result' },
      { id: 2, title: 'Result 2', description: 'Second search result' }
    ],
    total: 2
  });
});

// POST /api/comment - Add comment
router.post('/comment', (req, res) => {
  const { comment } = req.body;
  logger.info(`POST /api/comment`);
  
  res.json({ 
    message: 'Comment posted successfully',
    comment,
    id: Date.now()
  });
});

// GET /api/file - File access endpoint
router.get('/file', (req, res) => {
  const { path } = req.query;
  logger.info(`GET /api/file - Path: ${path}`);
  
  res.json({ 
    message: 'File access endpoint',
    path,
    content: 'File content would be here'
  });
});

// POST /api/exec - Execute command (demo)
router.post('/exec', (req, res) => {
  const { cmd } = req.body;
  logger.info(`POST /api/exec - Command: ${cmd}`);
  
  res.json({ 
    message: 'Command execution endpoint (demo)',
    command: cmd,
    output: 'Command output would be here'
  });
});

// GET /api/data - Get data
router.get('/data', (req, res) => {
  logger.info('GET /api/data');
  res.json({ 
    data: {
      timestamp: new Date().toISOString(),
      value: Math.random() * 100,
      status: 'active'
    }
  });
});

// POST /api/upload - File upload (demo)
router.post('/upload', (req, res) => {
  const { filename } = req.body;
  logger.info(`POST /api/upload - Filename: ${filename}`);
  
  res.json({ 
    message: 'File upload endpoint (demo)',
    filename,
    uploaded: true
  });
});

module.exports = router;