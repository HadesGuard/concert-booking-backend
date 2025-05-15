import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { setup as setupTestData } from './setup.js';

// Custom metrics
const errorRate = new Rate('errors');
const loginErrorRate = new Rate('login_errors');
const bookingErrorRate = new Rate('booking_errors');

export const options = {
  scenarios: {
    default: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 100 },  // Ramp up to 100 users
        { duration: '2m', target: 500 },  // Ramp up to 500 users
        { duration: '2m', target: 1000 }, // Ramp up to 1000 users
        { duration: '1m', target: 0 },    // Ramp down
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<10000', 'p(99)<20000'],
    http_req_failed: ['rate<0.1'],
    http_req_waiting: ['p(95)<5000'],
    errors: ['rate<0.1'],
    login_errors: ['rate<0.05'],
    booking_errors: ['rate<0.05'],
  },
  setupTimeout: '10m',
};

const AUTH_URL = 'http://localhost:3001/api/v1';
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

      if (response.status >= 200 && response.status < 300) {
        return response;
      }
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

function getAuthToken(user) {
  try {
    const loginRes = retryRequest('POST', `${AUTH_URL}/auth/login`, {
      email: user.email,
      password: user.password
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    check(loginRes, {
      'login successful': (r) => r.status === 200 || r.status === 201,
    }) || loginErrorRate.add(1);

    if (loginRes.status !== 200 && loginRes.status !== 201) {
      console.error('Login failed:', loginRes.status, loginRes.body);
      return null;
    }

    const res = loginRes.json();
    if (!res.access_token || !res.refresh_token || !res.user?.id) {
      console.error('Invalid login structure:', res);
      loginErrorRate.add(1);
      return null;
    }

    return {
      access_token: res.access_token,
      refresh_token: res.refresh_token,
      userId: res.user.id
    };
  } catch (err) {
    console.error('Failed to get auth token:', err);
    loginErrorRate.add(1);
    return null;
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

  const tokens = getAuthToken(user);
  if (!tokens) {
    errorRate.add(1);
    return;
  }

  // Randomly select a seat type ID
  const randomSeatTypeIndex = Math.floor(Math.random() * data.seatTypeIds.length);
  const selectedSeatTypeId = data.seatTypeIds[randomSeatTypeIndex];
  console.log('Selected seat type ID:', selectedSeatTypeId);

  const bookingPayload = {
    userId: tokens.userId,
    concertId: data.concertId,
    seatTypeId: selectedSeatTypeId,
    quantity: 1,
  };

  const headers = {
    'Authorization': `Bearer ${tokens.access_token}`,
    'Content-Type': 'application/json',
  };

  try {
    const res = retryRequest('POST', `${BOOKING_URL}/bookings`, bookingPayload, headers);

    check(res, {
      'booking created': (r) => r.status === 201,
    }) || bookingErrorRate.add(1);

    if (res.status !== 201) {
      console.error('Booking failed:', res.body);
      bookingErrorRate.add(1);
    }
  } catch (error) {
    console.error('Booking request failed:', error);
    bookingErrorRate.add(1);
  }
}
