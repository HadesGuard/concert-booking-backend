#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status messages
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to cleanup on exit
cleanup() {
    print_status "Cleaning up..."
    docker compose down -v
}

# Register cleanup function
trap cleanup EXIT

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    print_error "k6 is not installed"
    echo "Please install k6 first:"
    echo "  - macOS: brew install k6"
    echo "  - Windows: choco install k6"
    echo "  - Docker: docker pull grafana/k6"
    exit 1
fi

# 1. Clean up previous runs
print_status "Stopping and removing all containers..."
docker compose down -v

# 2. Start all services
print_status "Starting all services..."
if ! docker compose up -d --build; then
    print_error "Failed to start services"
    exit 1
fi

# 3. Wait for services to be healthy
print_status "Waiting for services to be healthy..."
max_attempts=60  # Increased from 30 to 60
attempt=1
while [ $attempt -le $max_attempts ]; do
    if curl -s http://localhost:3001/api/v1/health | grep -q "ok" && \
       curl -s http://localhost:3002/api/v1/health | grep -q "ok" && \
       curl -s http://localhost:3003/api/v1/health | grep -q "ok"; then
        print_status "All services are healthy!"
        break
    fi
    print_warning "Waiting for services to be healthy... (attempt $attempt/$max_attempts)"
    sleep 2
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    print_error "Services failed to become healthy in time"
    print_status "Checking service logs..."
    docker compose logs
    exit 1
fi

# 4. Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30  # Increased from 10 to 30 seconds

# 5. Run k6 load test
print_status "Running k6 load test..."
if ! k6 run load-test/booking-test.js; then
    print_error "Load test failed"
    print_status "Test results:"
    echo "----------------------------------------"
    echo "Please check the test results above"
    echo "----------------------------------------"
    exit 1
fi

print_status "Load test completed successfully!" 