#!/bin/bash

# Script to generate database errors for dashboard testing
# This will generate a random database error every 3 seconds
# Press Ctrl+C to exit

BASE_URL="http://localhost:3000/db"

# Error endpoints
ERROR_ENDPOINTS=(
  "/db-error"
  "/ora-00942"
  "/ora-00001"
  "/syntax-error"
  "/group-by"
  "/string-conversion"
  "/ora-12154"
  "/deadlock"
  "/missing-param"
  "/ora-01652"
  "/foreign-key"
)

# Regular endpoints
NORMAL_ENDPOINTS=(
  "/users"
  "/users/1"
  "/posts"
  "/posts/1"
  "/slow-query"
)

# Color formatting
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to make a request to a given endpoint
make_request() {
  local endpoint=$1
  local is_error=$2
  
  if [[ $is_error -eq 1 ]]; then
    echo -e "${RED}Generating error: ${endpoint}${NC}"
  else
    echo -e "${GREEN}Making regular request: ${endpoint}${NC}"
  fi
  
  response=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}${endpoint}")
  
  if [[ $is_error -eq 1 && $response -eq 500 ]]; then
    echo -e "${YELLOW}Expected error response: ${response}${NC}"
  elif [[ $is_error -eq 0 && $response -eq 200 ]]; then
    echo -e "${BLUE}Successful response: ${response}${NC}"
  else
    echo -e "${RED}Unexpected response: ${response}${NC}"
  fi
  
  echo "---------------------------------"
}

# Welcome message
echo -e "${GREEN}Starting database error generator${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo "---------------------------------"

# Register trap for clean exit
trap 'echo -e "\n${GREEN}Stopping error generator${NC}"; exit 0' INT

# Main loop
count=1
while true; do
  echo -e "${BLUE}Iteration: $count${NC}"
  
  # Make an error request 70% of the time
  if [[ $((RANDOM % 10)) -lt 7 ]]; then
    random_error=${ERROR_ENDPOINTS[$RANDOM % ${#ERROR_ENDPOINTS[@]}]}
    make_request $random_error 1
  else
    # Make a normal request 30% of the time
    random_normal=${NORMAL_ENDPOINTS[$RANDOM % ${#NORMAL_ENDPOINTS[@]}]}
    make_request $random_normal 0
  fi
  
  # Sleep between 0.5-0.8 seconds
  sleep_time=$(awk -v min=0.5 -v max=0.8 'BEGIN{srand(); print min+rand()*(max-min)}')
  echo "Waiting ${sleep_time} seconds..."
  sleep $sleep_time
  
  ((count++))
done 