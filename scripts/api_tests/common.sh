#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Base URL for all requests
BASE_URL="http://localhost:3000"

# Function to test an endpoint with expected status code
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

# Function to print section headers
print_header() {
  local title=$1
  echo -e "\n${BLUE}========================================${NC}"
  echo -e "${BLUE}   $title${NC}"
  echo -e "${BLUE}========================================${NC}"
}

# Function to print section completion
print_completion() {
  local message=$1
  echo -e "\n${BLUE}========================================${NC}"
  echo -e "${GREEN}✓ $message${NC}"
  echo -e "${BLUE}========================================${NC}"
} 