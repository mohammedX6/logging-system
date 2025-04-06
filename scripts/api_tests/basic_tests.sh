#!/bin/bash

# Source common functions
source "$(dirname "$0")/common.sh"

# Run basic endpoint tests
run_basic_tests() {
  print_header "Basic Endpoints"
  
  test_endpoint "/" "Root endpoint"
  test_endpoint "/success" "Success response"
  test_endpoint "/error" "Error response" 500
  test_endpoint "/slow" "Slow response"
  
  print_completion "Basic endpoint testing completed"
}

# If this script is run directly, execute the tests
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  run_basic_tests
fi 