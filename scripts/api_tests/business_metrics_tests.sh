#!/bin/bash

# Source common functions
source "$(dirname "$0")/common.sh"

# Test Business Metrics Endpoint - with different transaction types
test_business_metrics() {
  echo -e "\n${CYAN}Testing Business Metrics${NC}"
  
  # Array of transaction types
  local transaction_types=("order_created" "order_processed" "payment_processed" "user_registered" "user_login")
  
  # Test successful transactions for each type
  for type in "${transaction_types[@]}"; do
    echo -e "\n${CYAN}Transaction type:${NC} ${type} (success)"
    response=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/demo-business-transaction?type=${type}")
    
    if [ "$response" -eq "200" ]; then
      echo -e "${GREEN}✓ Success${NC}"
    else
      echo -e "${RED}✗ Failed${NC} - Got status code $response"
    fi
    
    # Short delay
    sleep 0.3
  done
  
  # Test failed transactions for each type
  for type in "${transaction_types[@]}"; do
    echo -e "\n${CYAN}Transaction type:${NC} ${type} (failure)"
    response=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/demo-business-transaction?type=${type}&fail=true")
    
    if [ "$response" -eq "500" ]; then
      echo -e "${GREEN}✓ Success${NC} - Got expected error status 500"
    else
      echo -e "${RED}✗ Failed${NC} - Expected 500, got $response"
    fi
    
    # Short delay
    sleep 0.3
  done
}

# Run business metrics endpoint tests
run_business_metrics_tests() {
  print_header "Business Metrics Endpoints"
  
  test_endpoint "/demo-business-transaction" "Business transaction demo"
  test_endpoint "/demo-business-transaction?type=user_registered" "User registration transaction"
  test_endpoint "/demo-business-transaction?fail=true" "Failed business transaction" 500
  
  # Run detailed business metrics tests
  print_header "Generating Business Metrics"
  test_business_metrics
  
  # Generate more business transaction load for graphs
  generate_load "/demo-business-transaction?type=order_created" "Order creation" 8
  generate_load "/demo-business-transaction?type=payment_processed" "Payment processing" 6
  generate_load "/demo-business-transaction?type=user_registered" "User registration" 5
  generate_load "/demo-business-transaction?type=user_login" "User login" 10
  generate_load "/demo-business-transaction?type=order_processed" "Order processing" 7

  # Generate some business failures for error metrics
  generate_load "/demo-business-transaction?type=order_created&fail=true" "Failed order creation" 3 500
  generate_load "/demo-business-transaction?type=payment_processed&fail=true" "Failed payment processing" 2 500
  
  print_completion "Business metrics testing completed"
}

# If this script is run directly, execute the tests
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  run_business_metrics_tests
fi 