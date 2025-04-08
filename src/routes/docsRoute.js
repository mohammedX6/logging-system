const express = require('express');
const router = express.Router();

// Define all available endpoints
const endpoints = [
  // Basic Routes
  { path: '/', method: 'GET', description: 'Root endpoint - Basic response' },
  { path: '/success', method: 'GET', description: 'Returns 200 OK success response' },
  { path: '/error', method: 'GET', description: 'Returns 500 Internal Server Error' },
  { path: '/slow', method: 'GET', description: 'Simulates a 2-second delay before responding' },
  { path: '/demo-business-transaction', method: 'GET', description: 'Demo business transaction with optional failure simulation' },
  
  // Load Test Routes
  { path: '/load-test/cpu-intensive', method: 'GET', description: 'CPU intensive operation (calculates prime numbers)' },
  { path: '/load-test/memory-intensive', method: 'GET', description: 'Memory intensive operation (creates large arrays)' },
  { path: '/load-test/random-latency', method: 'GET', description: 'Random response times (0-2000ms)' },
  { path: '/load-test/extreme-cpu', method: 'GET', description: 'Extreme CPU load using recursive Fibonacci calculation' },
  { path: '/load-test/memory-leak', method: 'GET', description: 'Memory leak simulation that adds items to a global array' },
  { path: '/load-test/reset-memory-leak', method: 'GET', description: 'Resets the memory leak simulation' },
  { path: '/load-test/heavy-io', method: 'GET', description: 'Heavy I/O operations simulation' },
  { path: '/load-test/complex-query', method: 'GET', description: 'Complex database query simulation with joins and aggregations' },
  { path: '/load-test/concurrent-workload', method: 'GET', description: 'Concurrent workload running multiple operations in parallel' },
  
  // Error Routes
  { path: '/errors/not-found', method: 'GET', description: 'Returns 404 Not Found response' },
  { path: '/errors/bad-request', method: 'GET', description: 'Returns 400 Bad Request response' },
  { path: '/errors/unauthorized', method: 'GET', description: 'Returns 401 Unauthorized response' },
  { path: '/errors/forbidden', method: 'GET', description: 'Returns 403 Forbidden response' },
  { path: '/errors/exception', method: 'GET', description: 'Throws an uncaught exception (handled by error middleware)' },
  { path: '/errors/debug-error', method: 'GET', description: 'Returns detailed error information for debugging' },
  { path: '/errors/multi-error-test', method: 'GET', description: 'Generates multiple error types in logs for Grafana testing' },
  { path: '/errors/grafana-error-test', method: 'GET', description: 'Creates a comprehensive error log entry with all possible properties for Grafana testing' },
  
  // Database Routes
  { path: '/db/users', method: 'GET', description: 'Get all users from simulated database' },
  { path: '/db/users/:id', method: 'GET', description: 'Get a user by ID with related posts' },
  { path: '/db/posts', method: 'GET', description: 'Get all posts from simulated database' },
  { path: '/db/posts/:id', method: 'GET', description: 'Get a post by ID with comments and author' },
  { path: '/db/db-error', method: 'GET', description: 'Simulates a database connection error' },
  { path: '/db/slow-query', method: 'GET', description: 'Simulates a slow database query (3 seconds)' },
  { path: '/db/ora-00942', method: 'GET', description: 'Simulates Oracle ORA-00942: Table or view does not exist error' },
  { path: '/db/syntax-error', method: 'GET', description: 'Simulates SQL syntax error' },
  { path: '/db/deadlock', method: 'GET', description: 'Simulates database deadlock error' },
  { path: '/db/ora-01652', method: 'GET', description: 'Simulates Oracle ORA-01652: Unable to extend temp segment error' },
  { path: '/db/foreign-key', method: 'GET', description: 'Simulates foreign key constraint error' },
  
  // System Routes
  { path: '/metrics', method: 'GET', description: 'Prometheus metrics endpoint' },
  { path: '/health', method: 'GET', description: 'Basic health check endpoint' },
  { path: '/health/detailed', method: 'GET', description: 'Detailed health status with memory usage and active requests' },
  { path: '/docs', method: 'GET', description: 'This documentation page' }
];

// Documentation route
router.get('/', (req, res) => {
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
      <pre>curl http://localhost:${process.env.PORT || 3000}/success</pre>
      <p>Then check the Grafana dashboard at <a href="http://localhost:3001">http://localhost:3001</a> (use admin/admin)</p>
    </body>
    </html>
  `;
  
  res.send(html);
});

module.exports = router; 