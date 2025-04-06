const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
// Add the business metrics utility
const businessMetrics = require('../utils/businessMetrics');

// Basic route
router.get('/', (req, res) => {
  logger.info('Root endpoint called');
  res.json({ 
    message: 'Welcome to the Monitoring POC v2',
    status: 'running'
  });
});

// Success response
router.get('/success', (req, res) => {
  logger.info('Success endpoint called');
  res.status(200).json({ 
    success: true, 
    message: 'Operation completed successfully', 
    timestamp: new Date().toISOString() 
  });
});

// Error response
router.get('/error', (req, res) => {
  logger.error('Error endpoint called');
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error', 
    timestamp: new Date().toISOString() 
  });
});

// Slow response
router.get('/slow', (req, res) => {
  logger.info('Slow endpoint called - will respond in 2 seconds');
  setTimeout(() => {
    res.json({ 
      success: true, 
      message: 'This response was delayed by 2 seconds', 
      timestamp: new Date().toISOString() 
    });
    logger.info('Slow endpoint response sent');
  }, 2000);
});

// Demo business metrics route
router.get('/demo-business-transaction', async (req, res) => {
  const type = req.query.type || businessMetrics.TRANSACTION_TYPES.ORDER_CREATED;
  const shouldFail = req.query.fail === 'true';
  
  // Start measuring the transaction duration
  const endMeasurement = businessMetrics.startMeasuring(type);
  
  try {
    // Simulate processing time (random between 100-1000ms)
    const processingTime = Math.floor(Math.random() * 900) + 100;
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    // Optionally simulate failure
    if (shouldFail) {
      throw new Error('Simulated transaction failure');
    }
    
    // End measurement with success status
    const duration = endMeasurement(businessMetrics.STATUS.SUCCESS, {
      processingTime,
      transactionId: `tx-${Date.now()}`
    });
    
    res.json({
      success: true,
      message: `Business transaction '${type}' completed`,
      duration: `${duration.toFixed(3)} seconds`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // End measurement with error status
    const duration = endMeasurement(businessMetrics.STATUS.ERROR, {
      error: error.message,
      transactionId: `tx-${Date.now()}`
    });
    
    res.status(500).json({
      success: false,
      message: `Business transaction '${type}' failed: ${error.message}`,
      duration: `${duration.toFixed(3)} seconds`,
      timestamp: new Date().toISOString()
    });
  }
});

// Export the router
module.exports = router; 