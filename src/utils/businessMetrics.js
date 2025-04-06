/**
 * Business Metrics Utility
 * 
 * This module provides functions for tracking business-level metrics
 * that go beyond basic HTTP/system metrics.
 */

const metrics = require('./metrics');
const logger = require('./logger');

// Sample business transaction types
const TRANSACTION_TYPES = {
  ORDER_CREATED: 'order_created',
  ORDER_PROCESSED: 'order_processed',
  PAYMENT_PROCESSED: 'payment_processed',
  USER_REGISTERED: 'user_registered',
  USER_LOGIN: 'user_login'
};

// Status values
const STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  PENDING: 'pending'
};

/**
 * Track a business transaction
 * 
 * @param {string} type - Transaction type from TRANSACTION_TYPES
 * @param {string} status - Status from STATUS
 * @param {number} duration - Duration in seconds
 * @param {Object} [additionalData] - Optional additional data to log
 */
const trackTransaction = (type, status, duration, additionalData = {}) => {
  try {
    // Record in Prometheus metrics
    metrics.trackBusinessTransaction(type, status, duration);
    
    // Log the transaction for additional context
    logger.info(`Business transaction tracked: ${type}`, {
      transaction_type: type,
      status,
      duration_seconds: duration,
      ...additionalData
    });
  } catch (error) {
    logger.error('Error tracking business transaction', { 
      error: error.message,
      transaction_type: type 
    });
  }
};

/**
 * Wrap business function with metrics timing
 * 
 * @param {Function} fn - Function to measure
 * @param {string} type - Transaction type
 * @param {Object} [additionalData] - Optional additional data to log
 * @returns {Function} - Wrapped function
 */
const withMetrics = (fn, type, additionalData = {}) => {
  return async (...args) => {
    const startTime = Date.now();
    let status = STATUS.SUCCESS;
    
    try {
      const result = await fn(...args);
      return result;
    } catch (error) {
      status = STATUS.ERROR;
      throw error;
    } finally {
      const duration = (Date.now() - startTime) / 1000;
      trackTransaction(type, status, duration, additionalData);
    }
  };
};

/**
 * Start measuring a business transaction
 * 
 * @param {string} type - Transaction type
 * @returns {Function} - Function to call when transaction completes
 */
const startMeasuring = (type) => {
  const startTime = Date.now();
  
  return (status = STATUS.SUCCESS, additionalData = {}) => {
    const duration = (Date.now() - startTime) / 1000;
    trackTransaction(type, status, duration, additionalData);
    return duration;
  };
};

// Create example transaction trackers
const trackOrderCreation = (duration, status = STATUS.SUCCESS, data = {}) => {
  trackTransaction(TRANSACTION_TYPES.ORDER_CREATED, status, duration, data);
};

const trackUserRegistration = (duration, status = STATUS.SUCCESS, data = {}) => {
  trackTransaction(TRANSACTION_TYPES.USER_REGISTERED, status, duration, data);
};

module.exports = {
  TRANSACTION_TYPES,
  STATUS,
  trackTransaction,
  withMetrics,
  startMeasuring,
  trackOrderCreation,
  trackUserRegistration
}; 