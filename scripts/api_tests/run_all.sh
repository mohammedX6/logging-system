#!/bin/bash

# Get the directory containing this script
DIR="$(dirname "$0")"

# Source common functions
source "$DIR/common.sh"

print_header "Testing All API Endpoints"

# Run all test suites
source "$DIR/basic_tests.sh"
source "$DIR/health_tests.sh"
source "$DIR/business_metrics_tests.sh"
source "$DIR/load_tests.sh"
source "$DIR/error_tests.sh"
source "$DIR/database_tests.sh"
source "$DIR/system_tests.sh"

print_header "All Tests Completed"

echo -e "\nView monitoring data at:"
echo -e "  - Grafana: ${GREEN}http://localhost:3001${NC} (admin/admin)"
echo -e "  - Business Metrics Dashboard: ${GREEN}http://localhost:3001/d/business-metrics/business-metrics-dashboard${NC}"
echo -e "  - Node.js App Dashboard: ${GREEN}http://localhost:3001/d/nodejs-app/node-js-application-dashboard${NC}"
echo -e "  - Prometheus: ${GREEN}http://localhost:9090${NC}"
echo -e "  - Node.js App: ${GREEN}http://localhost:3000${NC}"
echo -e "  - Loki: ${GREEN}http://localhost:3100${NC}" 