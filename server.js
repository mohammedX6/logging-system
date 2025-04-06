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

// Initialize system health metrics
metrics.updateSystemHealth('application', 1); // Mark app as healthy on startup

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Logging the error and continuing...');
  console.error(err.name, err.message);
  console.error(err.stack);
  
  // Capture additional error properties if they exist
  const errorDetails = {
    error: err.message,
    name: err.name,
    stack: err.stack
  };
  
  // Extract any custom properties that might be present
  if (err.code) errorDetails.code = err.code;
  if (err.details) errorDetails.details = err.details;
  if (err.query) {
    errorDetails.query = err.query;
    errorDetails.params = err.params;
  }
  
  logger.error('Uncaught exception', errorDetails);
  // Don't exit the process
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Logging the error and continuing...');
  console.error(err.name, err.message);
  console.error(err.stack);
  
  // Capture additional error properties if they exist
  const errorDetails = {
    error: err.message,
    name: err.name,
    stack: err.stack
  };
  
  // Extract any custom properties that might be present
  if (err.code) errorDetails.code = err.code;
  if (err.details) errorDetails.details = err.details;
  if (err.query) {
    errorDetails.query = err.query;
    errorDetails.params = err.params;
  }
  
  logger.error('Unhandled rejection', errorDetails);
  // Don't exit the process
});

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
  app.get('/docs', (req, res) => {
    const endpoints = [
      { path: '/', method: 'GET', description: 'Root endpoint - Basic response' },
      { path: '/success', method: 'GET', description: 'Returns 200 OK success response' },
      { path: '/error', method: 'GET', description: 'Returns 500 Internal Server Error' },
      { path: '/slow', method: 'GET', description: 'Simulates a 2-second delay before responding' },
      
      { path: '/load-test/cpu-intensive', method: 'GET', description: 'CPU intensive operation (calculates prime numbers)' },
      { path: '/load-test/memory-intensive', method: 'GET', description: 'Memory intensive operation (creates large arrays)' },
      { path: '/load-test/random-latency', method: 'GET', description: 'Random response times (0-2000ms)' },
      { path: '/load-test/extreme-cpu', method: 'GET', description: 'Extreme CPU load using recursive Fibonacci calculation' },
      { path: '/load-test/memory-leak', method: 'GET', description: 'Memory leak simulation that adds items to a global array' },
      { path: '/load-test/reset-memory-leak', method: 'GET', description: 'Resets the memory leak simulation' },
      { path: '/load-test/heavy-io', method: 'GET', description: 'Heavy I/O operations simulation' },
      { path: '/load-test/complex-query', method: 'GET', description: 'Complex database query simulation with joins and aggregations' },
      { path: '/load-test/concurrent-workload', method: 'GET', description: 'Concurrent workload running multiple operations in parallel' },
      
      { path: '/errors/not-found', method: 'GET', description: 'Returns 404 Not Found response' },
      { path: '/errors/bad-request', method: 'GET', description: 'Returns 400 Bad Request response' },
      { path: '/errors/unauthorized', method: 'GET', description: 'Returns 401 Unauthorized response' },
      { path: '/errors/forbidden', method: 'GET', description: 'Returns 403 Forbidden response' },
      { path: '/errors/exception', method: 'GET', description: 'Throws an uncaught exception (handled by error middleware)' },
      { path: '/errors/debug-error', method: 'GET', description: 'Returns detailed error information for debugging' },
      { path: '/errors/multi-error-test', method: 'GET', description: 'Generates multiple error types in logs for Grafana testing' },
      { path: '/errors/grafana-error-test', method: 'GET', description: 'Creates a comprehensive error log entry with all possible properties for Grafana testing' },
      
      { path: '/db/users', method: 'GET', description: 'Get all users from simulated database' },
      { path: '/db/users/:id', method: 'GET', description: 'Get a user by ID with related posts' },
      { path: '/db/posts', method: 'GET', description: 'Get all posts from simulated database' },
      { path: '/db/posts/:id', method: 'GET', description: 'Get a post by ID with comments and author' },
      { path: '/db/db-error', method: 'GET', description: 'Simulates a database connection error' },
      { path: '/db/slow-query', method: 'GET', description: 'Simulates a slow database query (3 seconds)' },
      
      { path: '/metrics', method: 'GET', description: 'Prometheus metrics endpoint' },
      { path: '/docs', method: 'GET', description: 'This documentation page' }
    ];
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>API Documentation - Monitoring POC v2</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
          }
          h1 { color: #2c3e50; }
          h2 { 
            color: #3498db; 
            margin-top: 30px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 30px;
          }
          th, td { 
            padding: 10px; 
            text-align: left; 
            border-bottom: 1px solid #ddd; 
          }
          th { 
            background-color: #f2f2f2; 
            font-weight: bold;
          }
          tr:hover { background-color: #f5f5f5; }
          .method { 
            font-weight: bold; 
            color: #3498db;
          }
          .path { 
            font-family: monospace; 
            background-color: #f5f5f5;
            padding: 2px 4px;
            border-radius: 3px;
          }
        </style>
      </head>
      <body>
        <h1>API Documentation - Monitoring POC v2</h1>
        <p>This API provides various endpoints for testing and monitoring.</p>
        
        <h2>Available Endpoints</h2>
        <table>
          <tr>
            <th>Method</th>
            <th>Path</th>
            <th>Description</th>
          </tr>
          ${endpoints.map(endpoint => `
            <tr>
              <td class="method">${endpoint.method}</td>
              <td class="path">${endpoint.path}</td>
              <td>${endpoint.description}</td>
            </tr>
          `).join('')}
        </table>
        
        <h2>Testing Instructions</h2>
        <p>
          To test these endpoints and observe metrics in Grafana, use tools like curl, wget, or Postman.
          For example:
        </p>
        <pre>curl http://localhost:${port}/success</pre>
        <p>Then check the Grafana dashboard at <a href="http://localhost:3001">http://localhost:3001</a> (use admin/admin)</p>
      </body>
      </html>
    `;
    
    res.send(html);
  });
  
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