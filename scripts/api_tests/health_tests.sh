#!/bin/bash

# Source common functions
source "$(dirname "$0")/common.sh"

# Run health check endpoint tests
run_health_tests() {
  print_header "Health Check Endpoints"
  
  test_endpoint "/health" "Basic health check"
  test_endpoint "/health/detailed" "Detailed health check"
  
  print_completion "Health check testing completed"
}

# If this script is run directly, execute the tests
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  run_health_tests
fi 