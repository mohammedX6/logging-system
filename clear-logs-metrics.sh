#!/bin/bash

# Script to clear all logs and metrics from the logging system
# This script clears:
# - Local log files
# - Prometheus metrics data
# - Loki log data
# - Preserves Grafana data (dashboards and settings)

echo "Starting cleanup process..."

# 1. Clear local log files
echo "Clearing local log files..."
> ./logs/app.log
> ./logs/error.log
echo "Local log files cleared."

# 2. Clear Prometheus data by removing the volume
echo "Clearing Prometheus metrics data..."
docker-compose down
docker volume rm logging-system_prometheus-data
echo "Prometheus metrics data cleared."

# 3. Clear Loki log data by removing the volume
echo "Clearing Loki log data..."
docker volume rm logging-system_loki-data
echo "Loki log data cleared."

# Restart the services
echo "Restarting services..."
docker-compose up -d
echo "Services restarted."

echo "Cleanup complete! All logs and metrics have been cleared." 