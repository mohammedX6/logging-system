# Monitoring POC v2

A centralized logging and monitoring system using open-source tools (Prometheus, Loki, Promtail, and Grafana) for Node.js applications.

## Overview

This project demonstrates a complete monitoring and observability stack for Node.js applications:

- **Node.js App**: An Express server with custom metrics, logging, and test APIs
- **Prometheus**: For scraping and storing time-series metrics
- **Loki**: For efficient log storage and querying
- **Promtail**: For collecting and forwarding logs to Loki
- **Grafana**: For visualization of metrics and logs, plus alerting

## Service URLs

| Service | URL | Description | Credentials |
|---------|-----|-------------|------------|
| **Node.js App** | http://localhost:3000 | Your instrumented application | N/A |
| **Node.js Docs** | http://localhost:3000/docs | API documentation | N/A |
| **Node.js Metrics** | http://localhost:3000/metrics | Raw Prometheus metrics | N/A |
| **Prometheus** | http://localhost:9090 | Metrics database and query engine | N/A |
| **Loki** | http://localhost:3100 | Log aggregation system (API only) | N/A |
| **Grafana** | http://localhost:3001 | Visualization dashboard | admin/admin |
| **Grafana Dashboard** | http://localhost:3001/d/nodejs-app/node-js-application-dashboard | Main Node.js dashboard | admin/admin |

**Note**: Promtail runs as an internal service on port 9080 with no UI.

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
┌──────┐  ┌──────────┐  ┌─────┐
│Promtail│ │Prometheus│  │(Future)│
└───┬──┘  └────┬─────┘  └─────┘
    │          │
    ▼          ▼
 ┌─────┐    ┌──────┐
 │Loki │    │Query │
 └──┬──┘    └───┬──┘
    │           │
    └─────┬─────┘
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
   - Produces logs through `winston` logger
   - Log files are saved in the `logs` directory

2. **Prometheus**
   - Regularly scrapes the `/metrics` endpoint of your app (every 15s)
   - Stores time-series metrics data
   - Provides a query language (PromQL) for analyzing metrics

3. **Promtail**
   - Watches and tails your log files
   - Adds labels like `job=nodejs-app`
   - Sends log entries to Loki

4. **Loki**
   - Receives and stores logs from Promtail
   - Makes logs available for querying
   - Groups logs by labels for efficient retrieval

5. **Grafana**
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

5. Promtail detects the new log entries and sends them to Loki

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
2. **src/utils/logger.js**: Configures Winston for structured logging
3. **docker-compose.yml**: Connects all services on the same network
4. **prometheus/prometheus.yml**: Tells Prometheus where to scrape metrics
5. **promtail/promtail-config.yml**: Tells Promtail which logs to collect
6. **grafana/provisioning/**: Pre-configures Grafana with dashboards and data sources

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

3. Access the services:
   - Node.js App: http://localhost:3000
   - Prometheus: http://localhost:9090
   - Grafana: http://localhost:3001 (admin/admin)
   - Loki: http://localhost:3100

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
├── promtail/                 # Promtail configuration
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