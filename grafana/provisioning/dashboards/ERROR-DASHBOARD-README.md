# Comprehensive Error Dashboard

This dashboard is dedicated to detailed error viewing and analysis. It presents error data from both Prometheus metrics (for quantity and trends) and Loki logs (for details and stack traces).

## Dashboard Panels Explanation

### 1. Error Metrics Overview
- **Error Trend by Endpoint**: Shows how errors trend over time by endpoint and status code
- **Error Distribution by Status Code**: Pie chart showing the distribution of error status codes
- **Endpoints With Errors**: Table showing which endpoints have the most errors

### 2. Detailed Error Logs
- **Filtered Error Logs**: Shows formatted error messages that can be filtered using the variables
- **Error Details Table**: Tabular view of error properties for quick comparison and analysis
- **Complete Error Logs**: Raw JSON view of the full error logs with all properties
- **Errors by Severity**: Timeline view showing errors by severity level
- **Stack Traces**: Dedicated panel for viewing error stack traces

## Using This Dashboard

### Filtering Options
- **Error Search**: Enter any text to filter errors (matches across all text fields)
- **Error Code**: Enter a regex pattern to match against error codes (e.g., `DATABASE.*` for all database errors)
- **Time Range**: Adjust the time picker at the top to focus on specific time periods

### Viewing Detailed Errors

To get the most out of this dashboard:

1. First, generate some errors using the test endpoints:
   - `/errors/debug-error` - Generates test error with custom properties
   - `/errors/exception` - Throws an exception that is caught by middleware
   - `/errors/multi-error-test` - Creates multiple different error types
   - `/errors/grafana-error-test` - Generates a comprehensive test error

2. Set a reasonable time range (last 15 minutes or 1 hour) in the time picker

3. Use the filters to narrow down to specific errors:
   - For ValidationErrors: Set Error Code to `VALIDATION.*` 
   - For all errors: Leave Error Code as `.*` (default)
   - Search for specific text in message: Enter text in Error Search

4. Click on any row in the Error Details Table to see all the properties for that error

5. Check the Stack Traces panel to debug the exact origin of errors

### Troubleshooting

If no errors appear:
1. Make sure you've generated errors recently (within your chosen time range)
2. Verify that Loki is receiving logs by checking its status
3. Try a wider time range or clearing the error filters
4. Restart the Grafana server if logs are being generated but not appearing

## Technical Notes

This dashboard queries:
- Prometheus for error metrics and counts
- Loki for detailed error logs
 
The logs are parsed using Loki's JSON parser with additional formatting for readability. 