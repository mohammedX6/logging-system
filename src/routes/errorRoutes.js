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
  const simulatedError = new Error('Simulated uncaught exception');
  simulatedError.code = 'EXCEPTION_ERROR';
  simulatedError.details = 'This is a simulated error with additional details for testing';
  
  logger.error('Exception endpoint called', { 
    error: simulatedError.message,
    code: simulatedError.code,
    details: simulatedError.details,
    stack: simulatedError.stack
  });
  
  // This will be caught by the error handler middleware
  throw simulatedError;
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

// Debug endpoint - shows detailed error with all properties
router.get('/debug-error', (req, res, next) => {
  logger.info('Debug error endpoint called');
  
  // Create a detailed error object with multiple properties for testing
  const debugError = new Error('Detailed debug error for testing');
  
  // Add standard properties
  debugError.code = 'DEBUG_ERROR_CODE';
  debugError.details = 'This is a debug error with many properties for testing the error handler';
  debugError.statusCode = 500;
  
  // Add custom properties
  debugError.requestId = `req-${Date.now()}`;
  debugError.userId = 'test-user-123';
  debugError.timestamp = new Date().toISOString();
  debugError.environment = process.env.NODE_ENV || 'development';
  debugError.validationErrors = [
    { field: 'username', message: 'Username is required' },
    { field: 'email', message: 'Invalid email format' }
  ];
  
  // Log the error with all its properties
  logger.error('Debug error created', {
    error: debugError.message,
    code: debugError.code,
    details: debugError.details,
    requestId: debugError.requestId,
    userId: debugError.userId,
    validationErrors: debugError.validationErrors,
    environment: debugError.environment,
    stack: debugError.stack
  });
  
  // Pass to the error handler middleware
  next(debugError);
});

// Multi-error test endpoint - creates multiple different errors for Grafana testing
router.get('/multi-error-test', (req, res) => {
  logger.info('Multi-error test endpoint called');
  
  // Generate 5 different types of errors for testing Grafana visualization
  const errorTypes = [
    {
      name: 'ValidationError',
      message: 'User data validation failed',
      code: 'VALIDATION_ERROR',
      details: 'Multiple fields failed validation checks',
      fields: ['email', 'password', 'username'],
      severity: 'medium'
    },
    {
      name: 'DatabaseError',
      message: 'Failed to connect to database',
      code: 'DB_CONNECTION_ERROR',
      details: 'Connection timeout after 30 seconds',
      dbHost: 'db-server-01',
      retryCount: 3,
      severity: 'high'
    },
    {
      name: 'AuthenticationError',
      message: 'Invalid credentials provided',
      code: 'AUTH_FAILED',
      details: 'Username or password is incorrect',
      ipAddress: '192.168.1.100',
      attempts: 5,
      severity: 'medium'
    },
    {
      name: 'RateLimitError',
      message: 'API rate limit exceeded',
      code: 'RATE_LIMIT',
      details: 'Too many requests in 1 minute window',
      currentRate: 120,
      limitPerMinute: 100,
      severity: 'low'
    },
    {
      name: 'InternalServerError',
      message: 'Unexpected internal server error',
      code: 'INTERNAL_ERROR',
      details: 'Unhandled exception in business logic',
      component: 'PaymentProcessor',
      traceId: `trace-${Date.now()}`,
      severity: 'critical'
    }
  ];
  
  // Log each error
  errorTypes.forEach(errorType => {
    const error = new Error(errorType.message);
    Object.assign(error, errorType);
    
    logger.error(`${errorType.name} occurred`, {
      error: errorType.message,
      code: errorType.code,
      details: errorType.details,
      name: errorType.name,
      severity: errorType.severity,
      ...errorType,
      timestamp: new Date().toISOString(),
      stack: error.stack
    });
  });
  
  // Return a response summarizing the test
  res.status(200).json({
    message: 'Multi-error test complete - 5 different error types logged',
    errorTypes: errorTypes.map(e => e.name),
    note: 'Check Grafana detailed error panel to see these errors',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint for Grafana error viewing
router.get('/grafana-error-test', (req, res) => {
  logger.info('Grafana error test endpoint called');
  
  // Create a detailed error with every possible property to test Grafana display
  const testError = new Error('Test error for Grafana visualization');
  
  // Add a comprehensive set of properties to test all display capabilities
  testError.code = 'GRAFANA_TEST_ERROR';
  testError.details = 'This error contains all possible properties for testing Grafana error visualization';
  testError.timestamp = new Date().toISOString();
  testError.requestId = `req-${Date.now()}`;
  testError.userId = 'test-user-123';
  testError.sessionId = 'sess-456-xyz';
  testError.severity = 'medium';
  testError.component = 'ErrorTestController';
  testError.method = 'GET';
  testError.path = '/errors/grafana-error-test';
  testError.params = { id: 123, action: 'test' };
  testError.headers = { 'user-agent': 'Test/1.0', 'content-type': 'application/json' };
  testError.validationErrors = [
    { field: 'username', message: 'Required field missing' },
    { field: 'email', message: 'Invalid email format' }
  ];
  testError.debugInfo = {
    nodeVersion: process.version,
    platform: process.platform,
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime()
  };
  
  // Add a very long stack trace with multiple nested calls to test display formatting
  testError.stack = `Error: Test error for Grafana visualization
    at GrafanaErrorTestHandler (/src/routes/errorRoutes.js:250:20)
    at processRequest (/src/middleware/requestHandler.js:42:12)
    at validateRequest (/src/middleware/validation.js:89:22)
    at authenticateUser (/src/middleware/auth.js:122:15)
    at loadUserProfile (/src/services/userService.js:56:18)
    at checkPermissions (/src/middleware/permissions.js:35:10)
    at executeBusinessLogic (/src/controllers/mainController.js:78:14)
    at executeQuery (/src/database/queryExecutor.js:123:22)
    at processStream (/src/utils/streams.js:45:11)
    at formatResponse (/src/utils/responseFormatter.js:62:8)
    at finalizeResponse (/src/middleware/responseFinalizer.js:28:15)
    at sendResponse (/src/utils/sender.js:19:7)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)`;
  
  // Log the comprehensive error
  logger.error('Grafana test error generated', {
    error: testError.message,
    code: testError.code,
    details: testError.details,
    requestId: testError.requestId,
    userId: testError.userId,
    sessionId: testError.sessionId,
    severity: testError.severity,
    component: testError.component,
    method: testError.method,
    path: testError.path,
    params: testError.params,
    headers: testError.headers,
    validationErrors: testError.validationErrors,
    debugInfo: testError.debugInfo,
    stack: testError.stack,
    timestamp: testError.timestamp
  });
  
  // Return a response with instructions
  res.status(200).json({
    message: 'Comprehensive error log created for Grafana testing',
    instructions: 'Open Grafana and go to the "Detailed Error Logs" panel to see this error with all its details',
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 