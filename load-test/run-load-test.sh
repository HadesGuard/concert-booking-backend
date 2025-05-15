#!/bin/bash

set -e

# # 1. Clean up previous runs
# echo "[1/4] Stopping and removing all containers..."
# docker compose down -v

# # 2. Start all services
# echo "[2/4] Starting all services..."
# docker compose up -d --build

# 3. Wait for services to be healthy
echo "[3/4] Waiting for services to be healthy..."
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
    if curl -s http://localhost:3001/api/v1/health > /dev/null && \
       curl -s http://localhost:3002/api/v1/health > /dev/null && \
       curl -s http://localhost:3003/api/v1/health > /dev/null; then
        echo "All services are healthy!"
        break
    fi
    echo "Waiting for services to be healthy... (attempt $attempt/$max_attempts)"
    sleep 2
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    echo "Services failed to become healthy in time"
    exit 1
fi

# 4. Run k6 load test
echo "[4/4] Running k6 load test..."
k6 run load-test/booking-test.js 