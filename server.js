require('dotenv').config();

// Import required dependencies
const express = require('express');
const morgan = require('morgan');

// Import utilities
const logger = require('./src/utils/logger');
const metrics = require('./src/utils/metrics');

// Import route modules
const basicRoutes = require('./src/routes/basicRoutes');
const loadTestRoutes = require('./src/routes/loadTestRoutes');
const errorRoutes = require('./src/routes/errorRoutes');
const databaseRoutes = require('./src/routes/databaseRoutes');
const docsRoute = require('./src/routes/docsRoute');

// Initialize system health metrics
metrics.updateSystemHealth('application', 1); // Mark app as healthy on startup

// Global error handlers
const handleError = (err, type) => {
  const errorDetails = {
    error: err.message,
    name: err.name,
    stack: err.stack,
    ...(err.code && { code: err.code }),
    ...(err.details && { details: err.details }),
    ...(err.query && { query: err.query, params: err.params })
  };
  
  logger.error(`${type} error`, errorDetails);
};

process.on('uncaughtException', (err) => handleError(err, 'Uncaught exception'));
process.on('unhandledRejection', (err) => handleError(err, 'Unhandled rejection'));


try {
  const app = express();
  const port = process.env.PORT || 3000;
  
  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan('combined', { stream: logger.stream }));
  
  // Metrics middleware
  try {
    app.use(metrics.httpMetricsMiddleware);
  } catch (err) {
    logger.error('Failed to initialize metrics middleware', { error: err.message });
    console.error('Failed to initialize metrics middleware', err);
    // Mark metrics as unhealthy
    metrics.updateSystemHealth('metrics', 0);
  }
  
  // Documentation route - showing all available endpoints
  app.use('/docs', docsRoute);

  
  // Metrics endpoint
  app.get('/metrics', async (req, res) => {
    try {
      res.set('Content-Type', metrics.register.contentType);
      res.end(await metrics.register.metrics());
    } catch (err) {
      logger.error('Error generating metrics', { error: err.message });
      res.status(500).send('Error generating metrics');
    }
  });
  
  // Enhanced health checks
  app.get('/health', (req, res) => {
    // Basic health check
    res.status(200).json({ status: 'UP' });
  });
  
  app.get('/health/detailed', (req, res) => {
    // More detailed health status
    const memStats = process.memoryUsage();
    const healthData = {
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      memory: {
        rss: `${Math.round(memStats.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memStats.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memStats.heapUsed / 1024 / 1024)} MB`,
        external: `${Math.round(memStats.external / 1024 / 1024)} MB`,
      },
      activeRequests: {
        GET: 0,
        POST: 0,
        PUT: 0,
        DELETE: 0
      }
    };
    
    // Try to get active requests metrics, handle gracefully if they don't exist
    try {
      healthData.activeRequests = {
        GET: metrics.activeRequests.labels('GET').get() || 0,
        POST: metrics.activeRequests.labels('POST').get() || 0,
        PUT: metrics.activeRequests.labels('PUT').get() || 0,
        DELETE: metrics.activeRequests.labels('DELETE').get() || 0
      };
    } catch (error) {
      logger.warn('Error getting active requests metrics', { error: error.message });
      // Keep the default values from the initial healthData object
    }
    
    res.status(200).json(healthData);
  });
  
  // Routes
  app.use('/', basicRoutes);
  app.use('/load-test', loadTestRoutes);
  app.use('/errors', errorRoutes);
  app.use('/db', databaseRoutes);
  
  // 404 handler
  app.use((req, res, next) => {
    logger.warn('Route not found', { path: req.originalUrl });
    res.status(404).json({
      message: 'Not Found',
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  });
  
  // Error handler
  app.use((err, req, res, next) => {
    try {
      // Extract additional error properties if they exist
      const errorDetails = {
        error: err.message,
        code: err.code,
        details: err.details,
        stack: err.stack
      };
      
      // If it's a database error, include additional database-specific information
      if (err.query) {
        errorDetails.query = err.query;
        errorDetails.params = err.params;
      }
      
      logger.error('Global error handler', errorDetails);
      
      const statusCode = err.statusCode || 500;
      
      // Create a response object with more detailed error information
      const errorResponse = {
        error: err.message || 'Internal Server Error',
        code: err.code,
        details: err.details,
        statusCode,
        path: req.path,
        timestamp: new Date().toISOString()
      };
      
      // In development mode, include additional debugging information
      const isDevelopment = process.env.NODE_ENV !== 'production';
      if (isDevelopment) {
        errorResponse.stack = err.stack;
        
        // Include additional error properties if they exist
        if (err.query) {
          errorResponse.query = err.query;
          errorResponse.params = err.params;
        }
        
        // Include any additional custom properties
        for (const [key, value] of Object.entries(err)) {
          if (!['message', 'stack', 'code', 'details', 'statusCode', 'query', 'params'].includes(key)) {
            errorResponse[key] = value;
          }
        }
      }
      
      res.status(statusCode).json(errorResponse);
    } catch (handlerError) {
      logger.error('Error in error handler', { error: handlerError.message });
      // If headers are already sent, we can't send another response
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  });
  
  // Start the server
  app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
    console.log(`Server is running on port ${port}`);
    metrics.updateSystemHealth('server', 1); // Mark server as healthy once listening
    
    logger.info('Available test endpoints:');
    logger.info('- Basic endpoints: /, /success, /error, /slow');
    logger.info('- Load test endpoints: /load-test/cpu-intensive, /load-test/memory-intensive, /load-test/random-latency, /load-test/extreme-cpu, /load-test/memory-leak, /load-test/reset-memory-leak, /load-test/heavy-io, /load-test/complex-query, /load-test/concurrent-workload');
    logger.info('- Error endpoints: /errors/not-found, /errors/bad-request, /errors/unauthorized, /errors/forbidden, /errors/exception, /errors/debug-error, /errors/multi-error-test, /errors/grafana-error-test');
    logger.info('- Database endpoints: /db/users, /db/users/:id, /db/posts, /db/posts/:id, /db/db-error, /db/slow-query');
    logger.info('- Documentation: /docs');
    logger.info('- Metrics: /metrics');
    logger.info('- Dashboard: Open http://localhost:3001 for Grafana dashboards (Comprehensive Error Dashboard available)');
  })
  .on('error', (err) => {
    logger.error('Server startup error', { error: err.message });
    console.error('Server startup error:', err);
    metrics.updateSystemHealth('server', 0); // Mark server as unhealthy if there's an error
  });
} catch (err) {
  logger.error('Application startup error', { error: err.message, stack: err.stack });
  console.error('Application startup error:', err);
  metrics.updateSystemHealth('application', 0); // Mark application as unhealthy
} 