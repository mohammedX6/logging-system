#!/bin/bash

# Source common functions
source "$(dirname "$0")/common.sh"

# Run error endpoint tests
run_error_tests() {
  print_header "Error Endpoints"
  
  # Standard HTTP error codes
  test_endpoint "/errors/not-found" "Not found response" 404
  test_endpoint "/errors/bad-request" "Bad request response" 400
  test_endpoint "/errors/unauthorized" "Unauthorized response" 401
  test_endpoint "/errors/forbidden" "Forbidden response" 403
  
  # Debugging and diagnostic error endpoints
  test_endpoint "/errors/debug-error" "Debug error information" 500
  test_endpoint "/errors/multi-error-test" "Multiple error types for logs" 200
  test_endpoint "/errors/grafana-error-test" "Comprehensive error log entry" 200
  
  # Test standard error endpoint
  test_endpoint "/error" "Standard 500 error response" 500
  
  # Avoid the /errors/exception endpoint as it might crash the app
  echo -e "${YELLOW}Skipping /errors/exception to avoid potential crash${NC}"
  
  print_completion "Error endpoints testing completed"
}

# Run error load generation for metrics
run_error_load() {
  print_header "Generating Error Metrics"
  
  # Generate regular HTTP error metrics
  generate_load "/errors/not-found" "Not found response" 5 404
  generate_load "/errors/bad-request" "Bad request response" 5 400
  generate_load "/errors/unauthorized" "Unauthorized response" 3 401
  generate_load "/errors/forbidden" "Forbidden response" 3 403
  
  # Generate 500 error metrics
  generate_load "/db/db-error" "Database error simulation" 3 500
  generate_load "/errors/debug-error" "Debug error information" 2 500
  
  # Generate specialized error metrics for monitoring (these return 200 but log errors)
  generate_load "/errors/multi-error-test" "Multiple error types" 2 200
  generate_load "/errors/grafana-error-test" "Comprehensive error logs" 2 200
  
  print_completion "Error load generation completed"
}

# If this script is run directly, execute the tests
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  run_error_tests
  run_error_load
fi 