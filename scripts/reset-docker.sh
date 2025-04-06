#!/bin/bash

# Print header
echo "=== Docker Environment Reset Script ==="
echo "This script will reset your Docker environment completely"

# Stop and remove all containers
echo "Stopping and removing all containers..."
docker-compose down --volumes --remove-orphans

# Remove all unused images
echo "Removing all unused images..."
docker image prune -a -f

# Remove all unused volumes
echo "Removing all unused volumes..."
docker volume prune -f

# Rebuild and start the containers
echo "Rebuilding and starting containers..."
docker-compose up --build -d

# Check if containers are running
echo "Checking container status..."
docker-compose ps

echo "=== Reset complete! ==="
echo "Your Docker environment has been reset and rebuilt"
echo "Access your services at:"
echo "- App: http://localhost:3000"
echo "- Grafana: http://localhost:3001"
echo "- Prometheus: http://localhost:9090"
echo "- Loki: http://localhost:3100" 