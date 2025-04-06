#!/bin/bash

# Source common functions
source "$(dirname "$0")/common.sh"

# Run database simulation endpoint tests
run_database_tests() {
  print_header "Database Simulation Endpoints"
  
  test_endpoint "/db/users" "Get all users"
  test_endpoint "/db/users/1" "Get user by ID"
  test_endpoint "/db/users/999" "Get non-existent user" 404
  test_endpoint "/db/posts" "Get all posts"
  test_endpoint "/db/posts/1" "Get post by ID"
  test_endpoint "/db/posts/999" "Get non-existent post" 404
  test_endpoint "/db/db-error" "Database error simulation" 500
  test_endpoint "/db/slow-query" "Slow database query"
  
  print_completion "Database simulation testing completed"
}

# If this script is run directly, execute the tests
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  run_database_tests
fi 