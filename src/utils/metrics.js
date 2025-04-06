const client = require('prom-client');
const logger = require('./logger');

// Create a Registry to register metrics
const register = new client.Registry();

// Add default metrics (event loop, memory, CPU, etc.)
client.collectDefaultMetrics({
  register,
  prefix: 'app_'
});

// Custom metrics
const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register]
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2.5, 5, 10],
  registers: [register]
});

const httpRequestSize = new client.Histogram({
  name: 'http_request_size_bytes',
  help: 'Size of HTTP requests in bytes',
  labelNames: ['method', 'route'],
  buckets: [100, 1000, 10000, 100000, 1000000],
  registers: [register]
});

const httpResponseSize = new client.Histogram({
  name: 'http_response_size_bytes',
  help: 'Size of HTTP responses in bytes',
  labelNames: ['method', 'route', 'status'],
  buckets: [100, 1000, 10000, 100000, 1000000],
  registers: [register]
});

const databaseQueryCounter = new client.Counter({
  name: 'database_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'entity'],
  registers: [register]
});

const databaseQueryDuration = new client.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'entity'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2.5, 5, 10],
  registers: [register]
});

const memoryUsage = new client.Gauge({
  name: 'app_memory_usage_bytes',
  help: 'Application memory usage in bytes',
  labelNames: ['type'],
  registers: [register],
  collect() {
    const memoryData = process.memoryUsage();
    this.set({ type: 'rss' }, memoryData.rss);
    this.set({ type: 'heapTotal' }, memoryData.heapTotal);
    this.set({ type: 'heapUsed' }, memoryData.heapUsed);
    this.set({ type: 'external' }, memoryData.external);
    if (memoryData.arrayBuffers) {
      this.set({ type: 'arrayBuffers' }, memoryData.arrayBuffers);
    }
  }
});

const activeRequests = new client.Gauge({
  name: 'http_active_requests',
  help: 'Number of active HTTP requests',
  labelNames: ['method'],
  registers: [register]
});

const errorCounter = new client.Counter({
  name: 'app_errors_total',
  help: 'Total number of errors',
  labelNames: ['type'],
  registers: [register]
});

// New custom metrics for load test APIs
const fibonacciDuration = new client.Histogram({
  name: 'fibonacci_calculation_duration_seconds',
  help: 'Duration of Fibonacci calculations in seconds',
  labelNames: ['input'],
  buckets: [0.001, 0.01, 0.1, 1, 5, 10, 30, 60],
  registers: [register]
});

const memoryLeakGauge = new client.Gauge({
  name: 'memory_leak_simulation_bytes',
  help: 'Memory allocated by the memory leak simulation',
  registers: [register]
});

const memoryLeakItemsGauge = new client.Gauge({
  name: 'memory_leak_items_count',
  help: 'Number of items in the memory leak array',
  registers: [register]
});

const ioOperationsDuration = new client.Histogram({
  name: 'io_operations_duration_seconds',
  help: 'Duration of I/O operations in seconds',
  labelNames: ['iterations'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register]
});

const complexQueryDuration = new client.Histogram({
  name: 'complex_query_duration_seconds',
  help: 'Duration of complex database queries in seconds',
  buckets: [1, 2, 5, 10, 20, 30],
  registers: [register]
});

const concurrentWorkloadDuration = new client.Histogram({
  name: 'concurrent_workload_duration_seconds',
  help: 'Duration of concurrent workload executions in seconds',
  buckets: [1, 2, 5, 10, 20, 30],
  registers: [register]
});

// Business level metrics
const businessTransactionCounter = new client.Counter({
  name: 'business_transactions_total',
  help: 'Total number of business transactions',
  labelNames: ['type', 'status'],
  registers: [register]
});

const businessTransactionDuration = new client.Histogram({
  name: 'business_transaction_duration_seconds',
  help: 'Duration of business transactions in seconds',
  labelNames: ['type', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2.5, 5, 10],
  registers: [register]
});

// Enhanced error metrics
const errorDetailsCounter = new client.Counter({
  name: 'error_details_total',
  help: 'Detailed breakdown of errors by category and subcategory',
  labelNames: ['category', 'subcategory', 'code'],
  registers: [register]
});

// System health metrics
const systemHealthGauge = new client.Gauge({
  name: 'system_health_status',
  help: 'System health indicators (1=healthy, 0=unhealthy)',
  labelNames: ['component'],
  registers: [register]
});

// Rate limiter metrics
const rateLimitCounter = new client.Counter({
  name: 'rate_limit_total',
  help: 'Total number of rate limit hits',
  labelNames: ['endpoint', 'ip'],
  registers: [register]
});

// Safe observe function to prevent app crashes
const safeObserve = (histogram, labels, value) => {
  try {
    // Convert to number and check if valid
    const numValue = Number(value);
    if (!isNaN(numValue) && typeof numValue === 'number' && isFinite(numValue)) {
      histogram.observe(labels, numValue);
    } else {
      logger.warn(`Invalid metric value: ${value}`, { 
        metric: histogram.name, 
        labels: JSON.stringify(labels),
        valueType: typeof value
      });
    }
  } catch (error) {
    logger.error(`Error recording metric: ${error.message}`, {
      metric: histogram.name,
      labels: JSON.stringify(labels),
      value
    });
  }
};

// Middleware for tracking HTTP metrics
const httpMetricsMiddleware = (req, res, next) => {
  try {
    // Track active requests
    activeRequests.inc({ method: req.method });

    // Track request size
    const requestSize = req.headers['content-length'] ? parseInt(req.headers['content-length']) : 0;
    safeObserve(httpRequestSize, { method: req.method, route: req.path }, requestSize);

    // Calculate request duration
    const start = Date.now();
    
    // Capture original end method
    const originalEnd = res.end;
    
    // Override end method to capture metrics
    res.end = function(chunk, encoding) {
      try {
        // Calculate request duration
        const duration = (Date.now() - start) / 1000;
        
        // Restore original end function
        res.end = originalEnd;
        
        // Call the original end function
        res.end(chunk, encoding);
        
        try {
          // Record metrics
          const route = req.route ? req.route.path || req.path : req.path;
          
          // Track request counter
          httpRequestCounter.inc({ 
            method: req.method, 
            route, 
            status: res.statusCode 
          });
          
          // Track request duration - Use safe observe
          safeObserve(
            httpRequestDuration, 
            { method: req.method, route, status: res.statusCode }, 
            duration
          );
          
          // Track response size - Use safe observe
          const responseSize = chunk ? chunk.length : 0;
          safeObserve(
            httpResponseSize, 
            { method: req.method, route, status: res.statusCode }, 
            responseSize
          );
          
          // Decrement active requests
          activeRequests.dec({ method: req.method });

          // If error, increment error counter
          if (res.statusCode >= 400) {
            const errorType = res.statusCode >= 500 ? 'server' : 'client';
            errorCounter.inc({ type: errorType });
          }
        } catch (error) {
          // Log the error but don't interrupt the response
          logger.error('Error recording metrics', { error: error.message });
        }
      } catch (error) {
        // If anything goes wrong, make sure we still call the original end
        res.end = originalEnd;
        res.end(chunk, encoding);
        logger.error('Error in metrics middleware', { error: error.message });
      }
    };
  } catch (error) {
    // Log any errors but continue processing the request
    logger.error('Error setting up metrics middleware', { error: error.message });
  }
  
  next();
};

// Utility functions for database metrics
const trackDatabaseQuery = (operation, entity, duration) => {
  try {
    databaseQueryCounter.inc({ operation, entity });
    safeObserve(databaseQueryDuration, { operation, entity }, duration);
  } catch (error) {
    logger.error('Error tracking database query', { error: error.message });
  }
};

// Error tracking
const trackError = (type) => {
  try {
    errorCounter.inc({ type });
  } catch (error) {
    logger.error('Error tracking application error', { error: error.message });
  }
};

// Utility function for tracking business transactions
const trackBusinessTransaction = (type, status, duration) => {
  try {
    businessTransactionCounter.inc({ type, status });
    safeObserve(businessTransactionDuration, { type, status }, duration);
  } catch (error) {
    logger.error('Error tracking business transaction', { error: error.message });
  }
};

// Enhanced error tracking with more details
const trackDetailedError = (category, subcategory, code) => {
  try {
    errorDetailsCounter.inc({ category, subcategory, code: code.toString() });
    // Also increment the general error counter
    errorCounter.inc({ type: category });
  } catch (error) {
    logger.error('Error in detailed error tracking', { error: error.message });
  }
};

// System health monitoring
const updateSystemHealth = (component, isHealthy) => {
  try {
    systemHealthGauge.set({ component }, isHealthy ? 1 : 0);
  } catch (error) {
    logger.error('Error updating system health', { error: error.message });
  }
};

// Track rate limiting
const trackRateLimit = (endpoint, ip) => {
  try {
    rateLimitCounter.inc({ endpoint, ip });
  } catch (error) {
    logger.error('Error tracking rate limit', { error: error.message });
  }
};

// Exports
module.exports = {
  register,
  httpMetricsMiddleware,
  trackDatabaseQuery,
  trackError,
  trackBusinessTransaction,
  trackDetailedError,
  updateSystemHealth,
  trackRateLimit,
  safeObserve,
  // Expose metrics for direct use in other files
  httpRequestCounter,
  httpRequestDuration,
  databaseQueryCounter,
  databaseQueryDuration,
  errorCounter,
  errorDetailsCounter,
  activeRequests,
  memoryUsage,
  fibonacciDuration,
  memoryLeakGauge,
  memoryLeakItemsGauge,
  ioOperationsDuration,
  complexQueryDuration,
  concurrentWorkloadDuration,
  businessTransactionCounter,
  businessTransactionDuration,
  systemHealthGauge,
  rateLimitCounter
}; 