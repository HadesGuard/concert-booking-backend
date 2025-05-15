# Load Testing for Concert Booking System

This directory contains load testing scripts for the concert booking system using k6.

## Prerequisites

1. Install k6:
   ```bash
   # macOS
   brew install k6

   # Windows
   choco install k6

   # Docker
   docker pull grafana/k6
   ```

2. Set up test data:
   - Create a test user in the system
   - Create a test concert
   - Update `CONCERT_ID` and `SEAT_TYPE` in `booking-test.js`

## Running Tests

1. Start all services:
   ```bash
   docker-compose up
   ```

2. Run the load test:
   ```bash
   k6 run booking-test.js
   ```

   Or using Docker:
   ```bash
   docker run -i grafana/k6 run - <booking-test.js
   ```

## Test Scenarios

The test script includes three scenarios:

### 1. 100 Users (5 minutes total)
- Ramp up to 100 users in 1 minute
- Maintain 100 users for 3 minutes
- Ramp down to 0 in 1 minute

### 2. 1000 Users (9 minutes total)
- Ramp up to 1000 users in 2 minutes
- Maintain 1000 users for 5 minutes
- Ramp down to 0 in 2 minutes

### 3. 10000 Users (13 minutes total)
- Ramp up to 10000 users in 3 minutes
- Maintain 10000 users for 7 minutes
- Ramp down to 0 in 3 minutes

Each virtual user:
1. Logs in to get auth token
2. Creates a booking
3. Waits 1 second before next request

## Test Metrics

The test monitors:
- Response time (95th percentile should be < 2s)
- Error rate (should be < 10%)
- Number of successful bookings
- Number of failed bookings
- System resource usage (CPU, Memory)

## Customizing Tests

You can modify the test configuration in `booking-test.js`:
- Change number of virtual users
- Adjust test duration
- Modify thresholds
- Add more test scenarios

## Running Specific Scenarios

To run a specific scenario:
```bash
k6 run --out json=results.json booking-test.js
```

Then analyze the results:
```bash
k6 report results.json
``` 