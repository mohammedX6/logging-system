#!/bin/bash

# Source common functions
source "$(dirname "$0")/common.sh"

# Run error endpoint tests
run_error_tests() {
  print_header "Error Endpoints"
  
  test_endpoint "/errors/not-found" "Not found response" 404
  test_endpoint "/errors/bad-request" "Bad request response" 400
  test_endpoint "/errors/unauthorized" "Unauthorized response" 401
  test_endpoint "/errors/forbidden" "Forbidden response" 403
  
  # Avoid the /errors/exception endpoint as it might crash the app
  echo -e "${YELLOW}Skipping /errors/exception to avoid potential crash${NC}"
  
  print_completion "Error endpoints testing completed"
}

# Run error load generation for metrics
run_error_load() {
  print_header "Generating Error Metrics"
  
  # Generate some error metrics
  generate_load "/errors/not-found" "Not found response" 5 404
  generate_load "/errors/bad-request" "Bad request response" 5 400
  generate_load "/db/db-error" "Database error simulation" 3 500
  
  print_completion "Error load generation completed"
}

# If this script is run directly, execute the tests
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  run_error_tests
  run_error_load
fi 