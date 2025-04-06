#!/bin/bash

# Source common functions
source "$(dirname "$0")/common.sh"

# Run load test endpoint tests
run_load_tests() {
  print_header "Load Test Endpoints"
  
  test_endpoint "/load-test/cpu-intensive" "CPU intensive operation"
  test_endpoint "/load-test/memory-intensive" "Memory intensive operation"
  test_endpoint "/load-test/random-latency" "Random latency response"
  test_endpoint "/load-test/extreme-cpu" "Extreme CPU load (Fibonacci)"
  test_endpoint "/load-test/memory-leak" "Memory leak simulation"
  test_endpoint "/load-test/reset-memory-leak" "Reset memory leak"
  test_endpoint "/load-test/heavy-io" "Heavy I/O operations"
  test_endpoint "/load-test/complex-query" "Complex database query"
  test_endpoint "/load-test/concurrent-workload" "Concurrent workload test"
  
  print_completion "Load test endpoints testing completed"
}

# Run load generation function for stress testing
run_load_generation() {
  print_header "Generating Load for Metrics"
  
  # Generate load for CPU endpoints
  generate_load "/load-test/cpu-intensive" "CPU intensive operation" 10
  generate_load "/load-test/extreme-cpu" "Extreme CPU load (Fibonacci)" 3

  # Generate load for memory endpoints
  generate_load "/load-test/memory-intensive" "Memory intensive operation" 8
  generate_load "/load-test/memory-leak" "Memory leak simulation" 3
  generate_load "/load-test/reset-memory-leak" "Reset memory leak" 1

  # Generate random latency requests
  generate_load "/load-test/random-latency" "Random latency response" 15

  # Generate I/O load
  generate_load "/load-test/heavy-io" "Heavy I/O operations" 5

  # Generate database load
  generate_load "/load-test/complex-query" "Complex database query" 3
  generate_load "/db/slow-query" "Slow database query" 2

  # Generate concurrent workload
  generate_load "/load-test/concurrent-workload" "Concurrent workload test" 3
  
  print_completion "Load generation completed"
}

# If this script is run directly, execute the tests
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  run_load_tests
  run_load_generation
fi 