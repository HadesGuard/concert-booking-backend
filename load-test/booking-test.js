import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { setup } from './setup.js';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  scenarios: {
    // Test with 100 users
    '100_users': {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 100 },  // Ramp up to 100 users
        { duration: '3m', target: 100 },  // Stay at 100 users
        { duration: '1m', target: 0 },    // Ramp down to 0
      ],
    },
    // Test with 1000 users
    '1000_users': {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 1000 }, // Ramp up to 1000 users
        { duration: '5m', target: 1000 }, // Stay at 1000 users
        { duration: '2m', target: 0 },    // Ramp down to 0
      ],
    },
    // Test with 10000 users
    '10000_users': {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '3m', target: 10000 }, // Ramp up to 10000 users
        { duration: '7m', target: 10000 }, // Stay at 10000 users
        { duration: '3m', target: 0 },     // Ramp down to 0
      ],
    },
  },
  thresholds: {
    'http_req_duration': ['p(95)<2000'], // 95% of requests should be below 2s
    'errors': ['rate<0.1'],              // Error rate should be below 10%
  },
};

// Test data
const BASE_URL = 'http://localhost:3000/api/v1';
const SEAT_TYPES = ['VIP', 'STANDARD', 'ECONOMY'];

// Get test data from setup
export function setup() {
  return setup();
}

// Helper function to get auth token
function getAuthToken(user) {
  const loginRes = http.post(`${BASE_URL}/auth/login`, {
    email: user.email,
    password: user.password
  });
  
  check(loginRes, {
    'login successful': (r) => r.status === 200,
  });
  
  return loginRes.json('access_token');
}

// Main test function
export default function(data) {
  // Get random test user
  const user = data.testUsers[Math.floor(Math.random() * data.testUsers.length)];
  
  // Get auth token
  const token = getAuthToken(user);
  
  // Set headers
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  // Create booking with random seat type
  const seatType = SEAT_TYPES[Math.floor(Math.random() * SEAT_TYPES.length)];
  const bookingPayload = {
    concertId: data.concertId,
    seatType: seatType,
    quantity: 1,
  };
  
  const bookingRes = http.post(
    `${BASE_URL}/bookings`,
    JSON.stringify(bookingPayload),
    { headers }
  );
  
  // Check booking response
  check(bookingRes, {
    'booking status is 201': (r) => r.status === 201,
    'booking has id': (r) => r.json('id') !== undefined,
  });
  
  // Record errors
  errorRate.add(bookingRes.status !== 201);
  
  // Sleep between requests
  sleep(1);
} 