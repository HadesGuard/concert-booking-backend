import http from 'k6/http';
import { check } from 'k6';

// Service URLs
const AUTH_URL = 'http://localhost:3001/api/v1';
const CONCERT_URL = 'http://localhost:3002/api/v1';
const BOOKING_URL = 'http://localhost:3003/api/v1';

// Setup function to create test data
export function setup() {
  // 1. Create admin user if not exists
  const adminLoginRes = http.post(`${AUTH_URL}/auth/login`, {
    email: 'admin@example.com',
    password: 'admin123'
  });

  let adminToken;
  if (adminLoginRes.status === 401) {
    // Create admin user
    const createAdminRes = http.post(`${AUTH_URL}/auth/register`, {
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin'
    });
    check(createAdminRes, {
      'admin created': (r) => r.status === 201,
    });
    adminToken = createAdminRes.json('access_token');
  } else {
    adminToken = adminLoginRes.json('access_token');
  }

  // 2. Create test concert
  const concertPayload = {
    name: 'Load Test Concert',
    artist: 'Test Artist',
    venue: 'Test Venue',
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    endTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),  // Tomorrow + 1 hour
    description: 'This is a test concert for load testing',
    imageUrl: 'https://example.com/test-image.jpg',
    isActive: true
  };

  const concertRes = http.post(
    `${CONCERT_URL}/concerts`,
    JSON.stringify(concertPayload),
    {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  check(concertRes, {
    'concert created': (r) => r.status === 201,
  });

  const concertId = concertRes.json('id');

  // 3. Create seat types for the concert
  const seatTypes = [
    { name: 'VIP', price: 100, quantity: 1000 },
    { name: 'STANDARD', price: 50, quantity: 2000 },
    { name: 'ECONOMY', price: 25, quantity: 3000 }
  ];

  for (const seatType of seatTypes) {
    const seatTypeRes = http.post(
      `${CONCERT_URL}/concerts/${concertId}/seat-types`,
      JSON.stringify(seatType),
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    check(seatTypeRes, {
      'seat type created': (r) => r.status === 201,
    });
  }

  // 4. Create test users
  const testUsers = [];
  for (let i = 0; i < 100; i++) {
    const userPayload = {
      name: `Test User ${i}`,
      email: `test${i}@example.com`,
      password: 'password123'
    };

    const userRes = http.post(`${AUTH_URL}/auth/register`, userPayload);
    check(userRes, {
      'user created': (r) => r.status === 201,
    });

    testUsers.push({
      email: userPayload.email,
      password: userPayload.password
    });
  }

  return {
    concertId,
    testUsers
  };
} 