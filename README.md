# Node.js Monitoring & Logging System

A centralized logging and monitoring system using open-source tools (Prometheus, Loki, and Grafana) for Node.js applications.

## Overview

This project demonstrates a complete monitoring and observability stack for Node.js applications:

- **Node.js App**: An Express server with custom metrics, logging, and test APIs
- **Prometheus**: For scraping and storing time-series metrics
- **Loki**: For efficient log storage and querying
- **Grafana**: For visualization of metrics and logs, plus alerting

## Service URLs

| Service | URL | Description | Credentials |
|---------|-----|-------------|------------|
| **Node.js App** | http://localhost:3000 | Your instrumented application | N/A |
| **Node.js Docs** | http://localhost:3000/docs | API documentation | N/A |
| **Node.js Metrics** | http://localhost:3000/metrics | Raw Prometheus metrics | N/A |
| **Prometheus** | http://localhost:9090 | Metrics database and query engine | N/A |
| **Grafana** | http://localhost:3001 | Visualization dashboard | admin/admin |
| **Loki** | http://localhost:3100 | Log aggregation service | N/A |

## How to View Dashboards

1. Start all services with `docker-compose up -d`
2. Open your browser and navigate to http://localhost:3001
3. Log in with the default credentials (admin/admin)
4. Navigate to Dashboards > Browse to see available dashboards
5. Select "Node.js Application Dashboard" to view metrics and logs
6. Generate traffic by calling the test endpoints to see data populate

You can customize dashboards or create new ones using Grafana's dashboard editor.

## System Architecture & Data Flow

### Visual Flow Diagram

```
    ┌────────────────┐
    │                │
    │  Node.js App   │
    │                │
    └───────┬────────┘
            │
    ┌───────┼────────┐
    │       │        │
    ▼       ▼        ▼
┌─────┐  ┌────────┐  ┌─────┐
│Logs │  │/metrics│  │Trace│
└──┬──┘  └───┬────┘  └──┬──┘
   │         │          │
   ▼         ▼          ▼
┌─────┐  ┌──────────┐  ┌─────┐
│Loki │  │Prometheus│  │(Future)│
└──┬──┘  └────┬─────┘  └─────┘
    │         │
    └─────┬───┘
          │
          ▼
     ┌──────────┐
     │          │
     │ Grafana  │──────► Alerts
     │          │
     └──────────┘
          │
          ▼
    Dashboards & UI
```

### How It Works

1. **Your Node.js Application**
   - Generates metrics via `prom-client` (request counts, latency, memory usage)
   - Produces logs through `winston` logger with Loki transport
   - Logs are sent directly to Loki via HTTP

2. **Prometheus**
   - Regularly scrapes the `/metrics` endpoint of your app (every 15s)
   - Stores time-series metrics data
   - Provides a query language (PromQL) for analyzing metrics

3. **Loki**
   - Receives logs directly from the Node.js application via HTTP
   - Makes logs available for querying
   - Groups logs by labels for efficient retrieval

4. **Grafana**
   - Connects to both Prometheus and Loki as data sources
   - Displays metrics in visual dashboards
   - Shows log entries in searchable log viewers
   - Manages alert rules and notifications

### Request Lifecycle Example

When a request hits your `/load-test/cpu-intensive` endpoint:

1. The HTTP metrics middleware records:
   - Start time of the request
   - HTTP method and path
   - Active request counter increases

2. Your code logs the operation:
   ```javascript
   logger.info('CPU intensive endpoint called');
   ```

3. The CPU intensive operation runs, calculating prime numbers

4. When the response completes:
   - HTTP metrics middleware calculates request duration
   - Records status code
   - Updates counters and histograms
   - Active request counter decreases
   - Additional log entry is created

5. Logs are sent directly to Loki via the Winston Loki transport

6. Prometheus scrapes the updated `/metrics` endpoint on its next interval

7. Grafana displays:
   - Request rate from Prometheus metrics
   - Request duration from Prometheus metrics
   - CPU usage spike from Prometheus metrics
   - Log entries from Loki

8. If metrics exceed thresholds (e.g., response time > 1s):
   - Grafana alerts trigger
   - Notifications are sent (if configured)

### Key Integration Points

1. **src/utils/metrics.js**: Sets up Prometheus metrics and middleware
2. **src/utils/logger.js**: Configures Winston with Loki transport for direct logging
3. **docker-compose.yml**: Connects all services on the same network
4. **prometheus/prometheus.yml**: Tells Prometheus where to scrape metrics
5. **grafana/provisioning/**: Pre-configures Grafana with dashboards and data sources

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 22 (if running locally)

### Running the Stack

1. Clone this repository
2. Run the stack:

```bash
docker-compose up -d
```

3. To rebuild and restart the stack:

```bash
docker-compose down && docker-compose up --build -d
```

4. Access the services:
   - Node.js App: http://localhost:3000
   - Prometheus: http://localhost:9090
   - Grafana: http://localhost:3001 (admin/admin)
   - Loki: http://localhost:3100

5. (Optional) Run validation and tests:
   ```bash
   ./scripts/validate-services.sh
   ./scripts/test-apis.sh
   ```

## Logging System

The logging system uses Winston with Loki transport for direct log delivery:

1. **Log Configuration**:
   - Console transport for development output
   - Loki transport for all logs
   - Separate Loki transport for error logs with additional labels

2. **Log Structure**:
   - JSON format for structured logging
   - Timestamps in ISO format
   - Error details including stack traces
   - Custom labels for filtering

3. **Log Levels**:
   - error: For error conditions
   - warn: For warning conditions
   - info: For informational messages
   - http: For HTTP request logging
   - debug: For debug messages

4. **Viewing Logs**:
   - Access Grafana at http://localhost:3001
   - Navigate to Explore
   - Select Loki data source
   - Use LogQL queries to filter logs:
     - All logs: `{job="nodejs-app"}`
     - Error logs: `{job="nodejs-app", log_type="error"}`
     - HTTP logs: `{job="nodejs-app"} |= "HTTP"`

## Project Structure

```
.
├── docker-compose.yml        # Docker Compose configuration
├── Dockerfile                # Node.js app Dockerfile
├── server.js                 # Main application file
├── package.json              # Node.js dependencies
├── README.md                 # This readme file
├── src/
│   ├── routes/               # API route modules
│   │   ├── basicRoutes.js    # Basic test routes
│   │   ├── loadTestRoutes.js # Load testing routes
│   │   ├── errorRoutes.js    # Error generating routes
│   │   └── databaseRoutes.js # Database simulation routes
│   └── utils/                # Utility modules
│       ├── logger.js         # Winston logger configuration
│       └── metrics.js        # Prometheus metrics configuration
├── prometheus/               # Prometheus configuration
├── loki/                     # Loki configuration
├── grafana/                  # Grafana dashboards and datasources
└── logs/                     # Application logs directory (optional)
```

## Local Development

To run the application locally for development:

```bash
npm install
npm run dev
```

This will start the Node.js application with nodemon for automatic reloading.

## Utility Scripts

This project includes several utility scripts to help with development, testing, and maintenance:

### Main Scripts
- `scripts/test-apis.sh` - Runs all API tests to verify endpoint functionality
- `scripts/validate-services.sh` - Validates that all services are running correctly
- `scripts/reset-docker.sh` - Resets the entire Docker environment (stops, removes, rebuilds containers)
- `scripts/clear-logs-metrics.sh` - Clears all logs and metrics data while preserving Grafana dashboards
- `scripts/generate_db_errors.sh` - Generates random database errors for testing monitoring dashboards

### API Test Scripts
The `scripts/api_tests/` directory contains modular test scripts:
- `run_all.sh` - Runs all API tests in sequence
- `basic_tests.sh` - Tests basic application endpoints
- `load_tests.sh` - Tests load-generating endpoints
- `error_tests.sh` - Tests error-generating endpoints
- `database_tests.sh` - Tests database simulation endpoints
- `business_metrics_tests.sh` - Tests business metrics functionality
- `health_tests.sh` - Tests health check endpoints
- `system_tests.sh` - Tests system-level endpoints

### Script Usage

To run validation after deployment:
```bash
./scripts/validate-services.sh
```

To test all API endpoints:
```bash
./scripts/test-apis.sh
```

To clean up logs and metrics data:
```bash
./scripts/clear-logs-metrics.sh
```

To reset the entire Docker environment:
```bash
./scripts/reset-docker.sh
```

To generate test database errors for dashboard testing:
```bash
./scripts/generate_db_errors.sh
```

## Test APIs

The Node.js application includes numerous test endpoints organized into categories:

### Basic Endpoints
- `GET /` - Root endpoint
- `GET /success` - Returns a 200 OK response
- `GET /error` - Returns a 500 error response
- `GET /slow` - Returns a response after a 2-second delay

### Load Test Endpoints
- `GET /load-test/cpu-intensive` - CPU intensive operation (calculating prime numbers)
- `GET /load-test/memory-intensive` - Memory intensive operation (creates large array)
- `GET /load-test/random-latency` - Random response times between 0-2000ms

### Error Endpoints
- `GET /errors/not-found` - Returns a 404 Not Found response
- `GET /errors/bad-request` - Returns a 400 Bad Request response
- `GET /errors/unauthorized` - Returns a 401 Unauthorized response
- `GET /errors/forbidden` - Returns a 403 Forbidden response
- `GET /errors/exception` - Throws an uncaught exception
- `GET /errors/memory-leak` - Simulates a memory leak
- `GET /errors/reset-memory-leak` - Resets the memory leak simulation
- `GET /errors/debug-error` - Returns detailed error information for debugging

### Database Simulation Endpoints
- `GET /db/users` - Get all users from simulated database
- `GET /db/users/:id` - Get a user by ID with related posts
- `GET /db/posts` - Get all posts from simulated database
- `GET /db/posts/:id` - Get a post by ID with comments and author
- `GET /db/db-error` - Simulates a database connection error
- `GET /db/slow-query` - Simulates a slow database query (3 seconds)

### System Endpoints
- `GET /metrics` - Prometheus metrics endpoint
- `GET /docs` - API documentation page

## Grafana Dashboards

The system comes pre-configured with a Node.js application dashboard that displays:

- HTTP Request Rate
- HTTP Request Duration
- HTTP Error Count
- Application Logs
- Node.js Memory Usage
- Node.js CPU Usage

## Alerting

The system includes pre-configured alerts:

- **High Error Rate**: Triggers when more than 10% of requests return errors
- **Slow Response Time**: Triggers when the average response time exceeds 1 second

## Viewing Detailed Errors

The system provides detailed error information for debugging purposes. To view detailed errors:

1. Access one of the error endpoints, such as `/errors/debug-error` or `/errors/exception`
2. The response will include detailed error information including:
   - Error message
   - Error code
   - Additional details
   - Stack trace (in non-production environments)
   - Request path
   - Timestamp

### Viewing Errors in Grafana

For a more comprehensive view of error details, you can use the Grafana dashboards:

1. Generate some errors by accessing endpoints like:
   - `/errors/debug-error` - Creates a single detailed error
   - `/errors/exception` - Generates an uncaught exception
   - `/errors/multi-error-test` - Creates multiple different error types at once
   - `/errors/grafana-error-test` - Creates a comprehensive error with all possible fields

2. Open Grafana at http://localhost:3001 and log in with admin/admin

3. Choose one of the error-viewing dashboards:
   - **Node.js Application Dashboard** - Includes general error panels along with other application metrics
   - **Comprehensive Error Dashboard** - Dedicated dashboard with enhanced error visualization and filtering

4. In the Comprehensive Error Dashboard you'll find:
   - Error trends and distributions
   - Detailed error tables with all properties
   - Stack trace viewer
   - Filtering by error code and search term
   - Error severity visualization
   - Complete JSON view of errors

5. Use the filters and search to find specific errors:
   - Enter error codes like `VALIDATION_ERROR` in the Error Code filter 
   - Search for specific messages or terms in the Error Search
   - Filter by time range to find recent errors

6. For advanced analysis, expand the JSON view to see all error properties, including nested objects.

### Troubleshooting Missing Error Details

If you can't see detailed errors in Grafana:

1. **Verify Loki configuration**:
   - Make sure the `loki-config.yml` is properly configured
   - Check that logs are being received by Loki

2. **Log Collection Flow**:
   - Logs are sent directly from the Node.js application to Loki
   - Loki stores and indexes the logs
   - Grafana queries Loki to display logs

3. **Refresh Grafana**:
   - Try adjusting the time range in Grafana to include when errors were generated
   - Use the browser's refresh button or Grafana's refresh icon

4. **Check Loki directly**:
   - Go to Explore in Grafana and select the Loki data source
   - Run this query: `{job="nodejs-app"} |= "error" | json`
   - If logs appear here but not in panels, there might be an issue with panel queries

5. **Restart the stack**:
   - Sometimes logs don't appear until services are restarted
   - Try `docker-compose down` followed by `docker-compose up -d`

### Environment Configuration

In non-production environments (when `NODE_ENV` is not set to 'production'), the system includes additional debugging information in error responses, such as stack traces and custom error properties.

To change the environment mode:

```bash
# For development mode with detailed errors
export NODE_ENV=development
npm start

# For production mode with limited error details
export NODE_ENV=production
npm start
```

All errors are also logged to the console and to log files in the `logs` directory. These logs always contain full error details regardless of environment.

## Persistent Log Storage

The Loki service has been configured for persistent log storage with an extended retention period. Key features of this configuration include:

- **Retention Period**: Logs are stored for 365 days (1 year) before being deleted
- **Write-Ahead Log (WAL)**: Enabled to prevent data loss during unplanned shutdowns
- **Physical Storage**: All log data is stored in a persistent Docker volume
- **Compaction**: Regular compaction of log data to optimize storage usage
- **Automatic Restart**: Loki service automatically restarts if it crashes

### How Log Retention Works

1. Logs are collected by Promtail from your application
2. Promtail forwards logs to Loki for storage
3. Loki retains logs for 365 days (1 year) in persistent storage
4. After 365 days, logs are automatically deleted through the compaction process
5. The compaction process runs every 10 minutes to optimize storage

### Recovering After a Restart

Thanks to the persistent storage configuration, all logs will be retained even if:
- The application container is restarted
- The Docker host is rebooted
- Loki service crashes

To verify persistence after a restart:
1. Generate some logs by accessing application endpoints
2. Restart the Docker services: `docker-compose restart`
3. Check Grafana to confirm logs are still available

## Project Structure

```
.
├── docker-compose.yml        # Docker Compose configuration
├── Dockerfile                # Node.js app Dockerfile
├── server.js                 # Main application file
├── package.json              # Node.js dependencies
├── README.md                 # This readme file
├── src/
│   ├── routes/               # API route modules
│   │   ├── basicRoutes.js    # Basic test routes
│   │   ├── loadTestRoutes.js # Load testing routes
│   │   ├── errorRoutes.js    # Error generating routes
│   │   └── databaseRoutes.js # Database simulation routes
│   └── utils/                # Utility modules
│       ├── logger.js         # Winston logger configuration
│       └── metrics.js        # Prometheus metrics configuration
├── prometheus/               # Prometheus configuration
├── loki/                     # Loki configuration
├── grafana/                  # Grafana dashboards and datasources
└── logs/                     # Application logs directory
```

## Local Development

To run the application locally for development:

```bash
npm install
npm run dev
```

This will start the Node.js application with nodemon for automatic reloading.

## Logs

Logs are saved to files in the `logs` directory:

- `app.log`: Contains all logs at all levels
- `error.log`: Contains only error-level logs

These log files are automatically rotated when they reach 5MB, with a maximum of 5 historical files kept.

### Business Metrics Tracking

This system now includes business-level metrics tracking, which allows you to:

- Monitor business transactions beyond technical metrics
- Track success and failure rates for business operations
- Measure performance of business processes
- Visualize business health in Grafana dashboards

#### Using Business Metrics

To track business transactions in your code:

```javascript
const businessMetrics = require('./src/utils/businessMetrics');

// Option 1: Wrap a function with metrics
const processOrderWithMetrics = businessMetrics.withMetrics(
  processOrder, 
  businessMetrics.TRANSACTION_TYPES.ORDER_PROCESSED
);

// Option 2: Time a transaction manually
const endMeasurement = businessMetrics.startMeasuring(
  businessMetrics.TRANSACTION_TYPES.ORDER_CREATED
);

// Later when the transaction is done:
endMeasurement(businessMetrics.STATUS.SUCCESS, { orderId: 'abc123' });
```

#### Demo Endpoint

Try out the demo endpoint to see business metrics in action:

```
GET /demo-business-transaction
```

Query parameters:
- `type`: Transaction type (defaults to 'order_created')
- `fail`: Set to 'true' to simulate a failed transaction

### Enhanced Health Checks

The system now features improved health checks:

```
GET /health         - Simple status check
GET /health/detailed - Detailed system health information
```

The detailed health check provides memory statistics, uptime information, and active request counts.

### System Health Monitoring

System components now report their health status to Prometheus, which can be visualized in the Business Metrics Dashboard.

### Grafana Business Metrics Dashboard

A new Grafana dashboard for business metrics is available showing:
- Business transaction rates by type and status
- 95th percentile transaction duration
- System health status
- Error counts by type and category

## Available Metrics

This section documents all available metrics that can be queried in Prometheus and visualized in Grafana.

### Application Metrics

#### HTTP Metrics
- `http_requests_total{method="<method>", route="<route>", status="<status>"}` - Total number of HTTP requests
- `http_request_duration_seconds{method="<method>", route="<route>", status="<status>"}` - Duration of HTTP requests
- `http_request_size_bytes{method="<method>", route="<route>"}` - Size of HTTP requests
- `http_response_size_bytes{method="<method>", route="<route>", status="<status>"}` - Size of HTTP responses
- `http_active_requests{method="<method>"}` - Number of currently active HTTP requests

#### Memory Metrics
- `app_memory_usage_bytes{type="rss"}` - Resident Set Size memory usage
- `app_memory_usage_bytes{type="heapTotal"}` - Total heap size
- `app_memory_usage_bytes{type="heapUsed"}` - Used heap size
- `app_memory_usage_bytes{type="external"}` - External memory size
- `app_memory_usage_bytes{type="arrayBuffers"}` - Array buffers size

#### Node.js Runtime Metrics
- `app_nodejs_eventloop_lag_seconds` - Event loop lag
- `app_nodejs_eventloop_lag_p50_seconds` - Event loop lag 50th percentile
- `app_nodejs_eventloop_lag_p90_seconds` - Event loop lag 90th percentile
- `app_nodejs_eventloop_lag_p99_seconds` - Event loop lag 99th percentile
- `app_nodejs_active_handles{type="<type>"}` - Active handle count by type
- `app_nodejs_active_requests{type="<type>"}` - Active request count by type
- `app_nodejs_heap_size_total_bytes` - Total heap size
- `app_nodejs_heap_size_used_bytes` - Used heap size
- `app_nodejs_external_memory_bytes` - External memory usage

#### Process Metrics
- `app_process_cpu_seconds_total` - Total CPU time spent
- `app_process_resident_memory_bytes` - Resident memory size
- `app_process_virtual_memory_bytes` - Virtual memory size
- `app_process_heap_bytes` - Process heap size
- `app_process_open_fds` - Open file descriptors
- `app_process_max_fds` - Maximum file descriptors

#### Business Metrics
- `business_transactions_total{type="<type>", status="<status>"}` - Total business transactions
- `business_transaction_duration_seconds{type="<type>", status="<status>"}` - Business transaction duration
- `database_queries_total{operation="<operation>", entity="<entity>"}` - Total database queries
- `database_query_duration_seconds{operation="<operation>", entity="<entity>"}` - Database query duration

#### Error Metrics
- `app_errors_total{type="<type>"}` - Total application errors
- `error_details_total{category="<category>", subcategory="<subcategory>", code="<code>"}` - Detailed error breakdown

#### Load Test Metrics
- `fibonacci_calculation_duration_seconds{input="<input>"}` - Duration of Fibonacci calculations
- `memory_leak_simulation_bytes` - Memory allocated by leak simulation
- `memory_leak_items_count` - Items in memory leak simulation
- `io_operations_duration_seconds{iterations="<iterations>"}` - I/O operations duration
- `complex_query_duration_seconds` - Complex query duration
- `concurrent_workload_duration_seconds` - Concurrent workload duration

#### System Health
- `system_health_status{component="<component>"}` - System health indicators (1=healthy, 0=unhealthy)
- `up{job="<job>"}` - Target up/down status (1=up, 0=down)

### Useful PromQL Queries

#### Request Rate and Latency
```promql
# Request rate per second over 5 minutes
rate(http_requests_total[5m])

# 95th percentile request duration
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Success rate
sum(rate(http_requests_total{status=~"2.."}[5m])) / sum(rate(http_requests_total[5m]))
```

#### Memory Usage
```promql
# Memory usage trend
rate(app_memory_usage_bytes{type="heapUsed"}[5m])

# Memory usage by type
app_memory_usage_bytes

# Process resident memory
app_process_resident_memory_bytes
```

#### Error Rates
```promql
# Error rate per second
rate(app_errors_total[5m])

# HTTP error rate (status >= 400)
sum(rate(http_requests_total{status=~"[45].."}[5m]))

# Error percentage
(sum(rate(http_requests_total{status=~"[45].."}[5m])) / sum(rate(http_requests_total[5m]))) * 100
```

#### Performance
```promql
# Event loop lag trend
rate(app_nodejs_eventloop_lag_seconds[5m])

# CPU usage
rate(app_process_cpu_seconds_total[5m])

# Database query latency
histogram_quantile(0.95, rate(database_query_duration_seconds_bucket[5m]))
```

### Using These Metrics

1. **In Prometheus UI**:
   - Go to http://localhost:9090
   - Enter any of these metrics or PromQL queries
   - Click "Execute"
   - Switch between "Table" and "Graph" views

2. **In Grafana**:
   - Go to http://localhost:3001
   - Navigate to Dashboards
   - Use these metrics to create new panels or modify existing ones
   - Create alerts based on these metrics

3. **Best Practices**:
   - Use rates for counter metrics over time windows
   - Use histogram_quantile for latency analysis
   - Monitor both technical and business metrics
   - Set up alerts for critical thresholds

4. **Common Patterns**:
   - Monitor error rates and latencies
   - Track resource usage trends
   - Watch business transaction success rates
   - Alert on system health changes