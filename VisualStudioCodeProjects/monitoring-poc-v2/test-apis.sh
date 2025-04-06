#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Testing All API Endpoints${NC}"
echo -e "${BLUE}========================================${NC}"

test_endpoint() {
  local endpoint=$1
  local description=$2
  local expected_status=${3:-200}
  
  echo -e "\n${YELLOW}Testing:${NC} ${endpoint} - ${description}"
  
  # Make the request and capture status code
  response=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}${endpoint}")
  
  if [ "$response" -eq "$expected_status" ]; then
    echo -e "${GREEN}✓ Success${NC} - Got expected status code $response"
  else
    echo -e "${RED}✗ Failed${NC} - Expected $expected_status, got $response"
  fi
  
  # Add a small delay between requests
  sleep 0.5
}

# Function to generate load by calling an endpoint multiple times
generate_load() {
  local endpoint=$1
  local description=$2
  local count=${3:-5}
  local expected_status=${4:-200}
  
  echo -e "\n${PURPLE}Generating load:${NC} ${endpoint} - ${description} (${count} times)"
  
  for i in $(seq 1 $count); do
    echo -e "${PURPLE}Request ${i}/${count}${NC}"
    response=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}${endpoint}")
    
    if [ "$response" -eq "$expected_status" ]; then
      echo -e "${GREEN}✓${NC}"
    else
      echo -e "${RED}✗ (Status: $response)${NC}"
    fi
    
    # Add a small delay between requests
    sleep 0.2
  done
}

# Basic Endpoints
echo -e "\n${BLUE}Basic Endpoints:${NC}"
test_endpoint "/" "Root endpoint"
test_endpoint "/success" "Success response"
test_endpoint "/error" "Error response" 500
test_endpoint "/slow" "Slow response"

# Load Test Endpoints
echo -e "\n${BLUE}Load Test Endpoints:${NC}"
test_endpoint "/load-test/cpu-intensive" "CPU intensive operation"
test_endpoint "/load-test/memory-intensive" "Memory intensive operation"
test_endpoint "/load-test/random-latency" "Random latency response"
test_endpoint "/load-test/extreme-cpu" "Extreme CPU load (Fibonacci)"
test_endpoint "/load-test/memory-leak" "Memory leak simulation"
test_endpoint "/load-test/reset-memory-leak" "Reset memory leak"
test_endpoint "/load-test/heavy-io" "Heavy I/O operations"
test_endpoint "/load-test/complex-query" "Complex database query"
test_endpoint "/load-test/concurrent-workload" "Concurrent workload test"

# Error Endpoints
echo -e "\n${BLUE}Error Endpoints:${NC}"
test_endpoint "/errors/not-found" "Not found response" 404
test_endpoint "/errors/bad-request" "Bad request response" 400
test_endpoint "/errors/unauthorized" "Unauthorized response" 401
test_endpoint "/errors/forbidden" "Forbidden response" 403

# Avoid the /errors/exception endpoint as it might crash the app
echo -e "${YELLOW}Skipping /errors/exception to avoid potential crash${NC}"

# Database Simulation Endpoints
echo -e "\n${BLUE}Database Simulation Endpoints:${NC}"
test_endpoint "/db/users" "Get all users"
test_endpoint "/db/users/1" "Get user by ID"
test_endpoint "/db/users/999" "Get non-existent user" 404
test_endpoint "/db/posts" "Get all posts"
test_endpoint "/db/posts/1" "Get post by ID"
test_endpoint "/db/posts/999" "Get non-existent post" 404
test_endpoint "/db/db-error" "Database error simulation" 500
test_endpoint "/db/slow-query" "Slow database query"

# System Endpoints
echo -e "\n${BLUE}System Endpoints:${NC}"
test_endpoint "/metrics" "Prometheus metrics"
test_endpoint "/docs" "API documentation"

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}✓ All endpoints tested${NC}"
echo -e "${BLUE}========================================${NC}"

# Ask if user wants to run load generation
echo -e "\n${BLUE}Would you like to generate load to create metrics? (y/n)${NC}"
read -r run_load

if [[ $run_load == "y" || $run_load == "Y" ]]; then
  echo -e "\n${BLUE}========================================${NC}"
  echo -e "${BLUE}   Generating Load for Metrics${NC}"
  echo -e "${BLUE}========================================${NC}"
  
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
  
  # Generate some error metrics
  generate_load "/errors/not-found" "Not found response" 5 404
  generate_load "/errors/bad-request" "Bad request response" 5 400
  generate_load "/db/db-error" "Database error simulation" 3 500
  
  echo -e "\n${BLUE}========================================${NC}"
  echo -e "${GREEN}✓ Load generation completed${NC}"
  echo -e "${BLUE}========================================${NC}"
fi

echo -e "\nView monitoring data at:"
echo -e "  - Grafana: ${GREEN}http://localhost:3001${NC} (admin/admin)"
echo -e "  - Prometheus: ${GREEN}http://localhost:9090${NC}"
echo -e "  - Node.js App: ${GREEN}http://localhost:3000${NC}"
echo -e "  - Loki: ${GREEN}http://localhost:3100${NC}" 