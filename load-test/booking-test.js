import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { setup as setupTestData } from './setup.js';

// Custom metrics
const errorRate = new Rate('errors');
const bookingErrorRate = new Rate('booking_errors');

export const options = {
  scenarios: {
    concurrent_users: {
      executor: 'constant-vus',
      vus: 1000,
      duration: '1m',
      startTime: '0s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<10000', 'p(99)<20000'],
    http_req_failed: ['rate<0.1'],
    http_req_waiting: ['p(95)<5000'],
    errors: ['rate<0.1'],
    booking_errors: ['rate<0.05'],
  },
  setupTimeout: '10m',
};

const BOOKING_URL = 'http://localhost:3003/api/v1';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1; // seconds

function retryRequest(method, url, payload, headers, maxRetries = MAX_RETRIES) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = method === 'POST' 
        ? http.post(url, JSON.stringify(payload), { headers })
        : http.get(url, { headers });

      // If success (2xx), return
      if (response.status >= 200 && response.status < 300) {
        return response;
      }
      // If 4xx (client error), do not retry, return response immediately
      if (response.status >= 400 && response.status < 500) {
        return response;
      }
      // If 5xx (server error), retry
      lastError = new Error(`HTTP ${response.status}: ${response.body}`);
      sleep(RETRY_DELAY);
    } catch (error) {
      lastError = error;
      sleep(RETRY_DELAY);
    }
  }
  throw lastError;
}

export function setup() {
  console.log('Starting setup in booking-test.js...');
  try {
    const data = setupTestData();
    if (!data || !data.concertId || !data.testUsers?.length || !data.seatTypeIds?.length) {
      throw new Error('Test data initialization failed: Invalid structure');
    }
    console.log('Setup completed with data:', JSON.stringify(data));
    return data;
  } catch (error) {
    console.error('Setup failed:', error.message);
    throw error;
  }
}

export default function (data) {
  if (!data) {
    console.error('Test data not initialized');
    errorRate.add(1);
    return;
  }

  const user = data.testUsers[__VU % data.testUsers.length];
  console.log('Using user:', user.email);

  if (!user.access_token || !user.userId) {
    console.error('User missing required tokens:', user.email);
    errorRate.add(1);
    return;
  }

  // Randomly select a seat type ID
  const randomSeatTypeIndex = Math.floor(Math.random() * data.seatTypeIds.length);
  const selectedSeatTypeId = data.seatTypeIds[randomSeatTypeIndex];
  console.log('Selected seat type ID:', selectedSeatTypeId);

  const bookingPayload = {
    userId: user.userId,
    concertId: data.concertId,
    seatTypeId: selectedSeatTypeId,
    quantity: 1,
  };

  const headers = {
    'Authorization': `Bearer ${user.access_token}`,
    'Content-Type': 'application/json',
  };

  try {
    const res = retryRequest('POST', `${BOOKING_URL}/bookings`, bookingPayload, headers);

    // Log status code and response body for debugging
    console.log('Booking response:', res.status, res.body);

    check(res, {
      'booking created': (r) => r.status === 201 || r.status === 200,
    }) || bookingErrorRate.add(1);

    if (res.status !== 201 && res.status !== 200) {
      console.error('Booking failed:', res.body);
      bookingErrorRate.add(1);
    }
  } catch (error) {
    console.error('Booking request failed:', JSON.stringify(error, null, 2));
    bookingErrorRate.add(1);
  }
}
