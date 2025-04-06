#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}   Validating Monitoring System Services${NC}"
echo -e "${BLUE}============================================${NC}"

# Check if a service is running
check_service() {
  local service=$1
  local url=$2
  local expected_status=${3:-200}
  local check_type=${4:-"status"}
  
  echo -e "\n${YELLOW}Checking ${service}:${NC} ${url}"
  
  if [[ "$check_type" == "status" ]]; then
    # Check HTTP status
    response=$(curl -s -o /dev/null -w "%{http_code}" ${url})
    
    if [[ "$response" -eq "$expected_status" || "$response" -eq 302 ]]; then
      echo -e "${GREEN}✓ ${service} is running${NC} (Status: $response)"
      return 0
    else
      echo -e "${RED}✗ ${service} is not responding correctly${NC} (Expected: $expected_status, Got: $response)"
      return 1
    fi
  elif [[ "$check_type" == "content" ]]; then
    # Check content for specific text
    response=$(curl -s ${url})
    
    if [[ "$response" == *"$expected_status"* ]]; then
      echo -e "${GREEN}✓ ${service} is running and returning expected content${NC}"
      return 0
    else
      echo -e "${RED}✗ ${service} response doesn't contain expected content${NC}"
      return 1
    fi
  fi
}

# Check if Docker containers are running
check_containers() {
  echo -e "\n${YELLOW}Checking Docker containers:${NC}"
  
  containers=$(docker-compose ps -q)
  if [[ -z "$containers" ]]; then
    echo -e "${RED}✗ No containers running${NC}"
    return 1
  fi
  
  running_count=$(docker-compose ps | grep -c "Up")
  expected_count=5
  
  if [[ "$running_count" -eq "$expected_count" ]]; then
    echo -e "${GREEN}✓ All $expected_count containers are running${NC}"
    docker-compose ps
    return 0
  else
    echo -e "${RED}✗ Only $running_count/$expected_count containers running${NC}"
    docker-compose ps
    return 1
  fi
}

# Check for business metrics
check_business_metrics() {
  echo -e "\n${CYAN}Testing business metrics functionality:${NC}"
  
  # Step 1: Generate a business transaction
  echo -e "\n1. Generating test business transaction..."
  transaction_id="tx-$(date +%s)"
  transaction_type="order_created"
  curl -s -o /dev/null "${NODE_URL}/demo-business-transaction?type=${transaction_type}"
  echo -e "${GREEN}✓ Generated business transaction${NC} (Type: $transaction_type)"
  
  # Step 2: Wait a moment for Prometheus to scrape the metrics
  echo -e "\n2. Waiting for Prometheus to scrape business metrics (15s)..."
  sleep 15
  
  # Step 3: Check if Prometheus has the business metrics
  echo -e "\n3. Checking if Prometheus has business transaction metrics..."
  prom_query="business_transactions_total"
  prom_response=$(curl -s "${PROMETHEUS_URL}/api/v1/query?query=${prom_query}")
  
  if [[ "$prom_response" == *"success"* && "$prom_response" != *"[]"* ]]; then
    echo -e "${GREEN}✓ Prometheus has scraped business metrics${NC}"
  else
    echo -e "${RED}✗ Prometheus doesn't have expected business metrics${NC}"
  fi
  
  # Step 4: Check if Loki has the business transaction logs
  echo -e "\n4. Checking if Loki has business transaction logs..."
  loki_query="{job=\"nodejs-app\"} |= \"Business transaction tracked\""
  current_time=$(date +%s)
  start_time=$((current_time - 3600)) # 1 hour ago
  loki_response=$(curl -s -G --data-urlencode "query=${loki_query}" --data-urlencode "start=${start_time}000000000" --data-urlencode "end=${current_time}000000000" --data-urlencode "limit=5" "${LOKI_URL}/loki/api/v1/query_range")
  
  if [[ "$loki_response" == *"streams"* && "$loki_response" != *"parse error"* ]]; then
    echo -e "${GREEN}✓ Loki has collected business transaction logs${NC}"
  else
    echo -e "${YELLOW}⚠ Loki may not have business transaction logs yet${NC}"
  fi
}

# Test the full flow - generate data and check if it appears in Prometheus
check_data_flow() {
  echo -e "\n${YELLOW}Testing data flow by generating test data:${NC}"
  
  # Step 1: Generate some metrics with a request to the Node.js app
  echo -e "\n1. Generating test metrics and logs by calling API endpoints..."
  request_id="flow-test-$(date +%s)"
  curl -s -o /dev/null "${NODE_URL}/load-test/cpu-intensive?request_id=${request_id}"
  echo -e "${GREEN}✓ Generated test request${NC} (ID: $request_id)"
  
  # Step 2: Wait a moment for Prometheus to scrape the metrics
  echo -e "\n2. Waiting for Prometheus to scrape metrics (15s)..."
  sleep 15
  
  # Step 3: Check if Prometheus has the metrics
  echo -e "\n3. Checking if Prometheus has scraped the metrics..."
  prom_query="http_requests_total"
  prom_response=$(curl -s "${PROMETHEUS_URL}/api/v1/query?query=${prom_query}")
  
  if [[ "$prom_response" == *"success"* ]]; then
    echo -e "${GREEN}✓ Prometheus has scraped metrics${NC}"
  else
    echo -e "${RED}✗ Prometheus doesn't have expected metrics${NC}"
  fi
  
  # Step 4: Check if Loki has the logs
  echo -e "\n4. Checking if Loki has collected logs..."
  loki_query="{job=\"nodejs-app\"}"
  # Use query_range instead of query and add required parameters
  current_time=$(date +%s)
  start_time=$((current_time - 3600)) # 1 hour ago
  loki_response=$(curl -s -G --data-urlencode "query=${loki_query}" --data-urlencode "start=${start_time}000000000" --data-urlencode "end=${current_time}000000000" --data-urlencode "limit=5" "${LOKI_URL}/loki/api/v1/query_range")
  
  if [[ "$loki_response" == *"streams"* && "$loki_response" != *"parse error"* ]]; then
    echo -e "${GREEN}✓ Loki has collected logs${NC}"
  else
    echo -e "${RED}✗ Loki doesn't have expected logs${NC}"
  fi
  
  # Step 5: Check if Grafana can access the data sources
  echo -e "\n5. Checking if Grafana can access data sources..."
  grafana_response=$(curl -s "${GRAFANA_URL}/api/datasources" -u admin:admin)
  
  if [[ "$grafana_response" == *"name"* ]]; then
    echo -e "${GREEN}✓ Grafana can access data sources${NC}"
  else
    echo -e "${RED}✗ Grafana can't access data sources${NC}"
  fi
  
  # Step 6: Check for business metrics dashboards
  echo -e "\n6. Checking for business metrics dashboard..."
  grafana_dashboard=$(curl -s "${GRAFANA_URL}/api/dashboards/uid/business-metrics" -u admin:admin)
  
  if [[ "$grafana_dashboard" == *"Business"* ]]; then
    echo -e "${GREEN}✓ Business metrics dashboard is available${NC}"
  else
    echo -e "${YELLOW}⚠ Business metrics dashboard may not be available yet${NC}"
    echo -e "   Dashboard will be available after container restart or after importing manually"
  fi
}

# Service URLs
NODE_URL="http://localhost:3000"
PROMETHEUS_URL="http://localhost:9090"
LOKI_URL="http://localhost:3100"
GRAFANA_URL="http://localhost:3001"

# Step 1: Check if Docker containers are running
check_containers

# Step 2: Check individual services
echo -e "\n${BLUE}Checking Individual Services:${NC}"
check_service "Node.js App" "${NODE_URL}/docs"
check_service "Prometheus" "${PROMETHEUS_URL}/-/ready" 200
check_service "Loki" "${LOKI_URL}/loki/api/v1/status/buildinfo" 200
check_service "Grafana" "${GRAFANA_URL}/login" 200

# Step 3: Check if health endpoints are available
echo -e "\n${BLUE}Checking Health Endpoints:${NC}"
check_service "Basic Health" "${NODE_URL}/health" 200
check_service "Detailed Health" "${NODE_URL}/health/detailed" 200

# Step 4: Check business metrics functionality
check_business_metrics

# Step 5: Check the data flow between services
check_data_flow

echo -e "\n${BLUE}============================================${NC}"
echo -e "${BLUE}   Validation Complete${NC}"
echo -e "${BLUE}============================================${NC}"

echo -e "\nTo view your monitoring dashboards:"
echo -e "  - Grafana: ${GREEN}http://localhost:3001${NC} (admin/admin)"
echo -e "  - Business Metrics Dashboard: ${GREEN}http://localhost:3001/d/business-metrics/business-metrics-dashboard${NC}"
echo -e "  - Node.js App Dashboard: ${GREEN}http://localhost:3001/d/nodejs-app/node-js-application-dashboard${NC}"
echo -e "  - Use the test-apis.sh script to generate more test data" 