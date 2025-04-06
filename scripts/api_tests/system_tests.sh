#!/bin/bash

# Source common functions
source "$(dirname "$0")/common.sh"

# Run system endpoint tests
run_system_tests() {
  print_header "System Endpoints"
  
  test_endpoint "/metrics" "Prometheus metrics"
  test_endpoint "/docs" "API documentation"
  
  print_completion "System endpoints testing completed"
}

# If this script is run directly, execute the tests
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  run_system_tests
fi 