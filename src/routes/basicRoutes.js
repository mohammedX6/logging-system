const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Basic route - simple response
router.get('/', (req, res) => {
  logger.info('Root endpoint called');
  res.send('Monitoring POC v2 - Logging and Metrics System');
});

// Success route - always returns 200
router.get('/success', (req, res) => {
  logger.info('Success endpoint called');
  res.status(200).json({ 
    message: 'Success response', 
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Error route - returns 500 server error
router.get('/error', (req, res) => {
  logger.error('Error endpoint called', { error: 'Simulated server error' });
  res.status(500).json({ 
    message: 'Error response', 
    error: 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

// Slow route - simulates a slow response time
router.get('/slow', async (req, res) => {
  logger.info('Slow endpoint called', { duration: '2s' });
  // Simulate a slow request
  await new Promise(resolve => setTimeout(resolve, 2000));
  res.json({ 
    message: 'Slow response',
    processingTime: '2 seconds',
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 