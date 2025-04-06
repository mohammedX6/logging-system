const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Not found route - returns 404
router.get('/not-found', (req, res) => {
  logger.warn('Not found endpoint called');
  res.status(404).json({ 
    message: 'Resource not found', 
    error: 'Not Found',
    timestamp: new Date().toISOString()
  });
});

// Bad request route - returns 400
router.get('/bad-request', (req, res) => {
  logger.warn('Bad request endpoint called');
  res.status(400).json({ 
    message: 'Bad request', 
    error: 'Invalid parameters',
    timestamp: new Date().toISOString()
  });
});

// Unauthorized route - returns 401
router.get('/unauthorized', (req, res) => {
  logger.warn('Unauthorized endpoint called');
  res.status(401).json({ 
    message: 'Authentication required', 
    error: 'Unauthorized',
    timestamp: new Date().toISOString()
  });
});

// Forbidden route - returns 403
router.get('/forbidden', (req, res) => {
  logger.warn('Forbidden endpoint called');
  res.status(403).json({ 
    message: 'Access denied', 
    error: 'Forbidden',
    timestamp: new Date().toISOString()
  });
});

// Exception route - throws an uncaught exception
router.get('/exception', (req, res) => {
  logger.error('Exception endpoint called');
  // This will be caught by the error handler middleware
  throw new Error('Simulated uncaught exception');
});

// Memory leak simulation
let memoryLeakArray = [];
router.get('/memory-leak', (req, res) => {
  logger.warn('Memory leak endpoint called - adding 10,000 items to global array');
  // Add 10000 objects to the global array each time this endpoint is called
  for (let i = 0; i < 10000; i++) {
    memoryLeakArray.push({
      id: memoryLeakArray.length + i,
      data: `Memory leak item ${memoryLeakArray.length + i}`,
      timestamp: new Date().toISOString(),
      largeString: 'x'.repeat(1000)
    });
  }
  
  res.json({ 
    message: 'Memory leak simulation',
    currentSize: memoryLeakArray.length,
    memoryEstimate: `~${(memoryLeakArray.length * 1050) / (1024 * 1024)} MB`,
    timestamp: new Date().toISOString()
  });
});

// Reset memory leak
router.get('/reset-memory-leak', (req, res) => {
  logger.info('Resetting memory leak array');
  const previousSize = memoryLeakArray.length;
  memoryLeakArray = [];
  
  res.json({ 
    message: 'Memory leak array reset',
    previousSize: previousSize,
    currentSize: memoryLeakArray.length,
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 