import http from 'k6/http';
import { check, sleep } from 'k6';

// Service URLs
const AUTH_URL = 'http://localhost:3001/api/v1';
const CONCERT_URL = 'http://localhost:3002/api/v1';
const BOOKING_URL = 'http://localhost:3003/api/v1';

// Setup function to create test data
export function setup() {
  console.log('Starting test data setup...');

  // Add retry mechanism for service readiness
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      // Check if services are responding
      const authHealth = http.get(`${AUTH_URL}/health`);
      const concertHealth = http.get(`${CONCERT_URL}/health`);
      const bookingHealth = http.get(`${BOOKING_URL}/health`);
      
      if (authHealth.status !== 200 || concertHealth.status !== 200 || bookingHealth.status !== 200) {
        throw new Error('Services are not ready');
      }
      
      console.log('All services are healthy, proceeding with setup...');
      
      // 1. Create admin user if not exists
      console.log('Attempting to login/create admin user...');
      let adminResponse;
      try {
        // Try to login first
        adminResponse = http.post(`${AUTH_URL}/auth/login`, JSON.stringify({
          email: 'admin@example.com',
          password: 'admin123'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });

        if (adminResponse.status === 201 || adminResponse.status === 200) {
          console.log('Admin user logged in successfully');
        } else {
          // If login fails, create admin user
          console.log('Creating admin user...');
          adminResponse = http.post(`${AUTH_URL}/auth/register`, JSON.stringify({
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'admin123'
          }), {
            headers: { 'Content-Type': 'application/json' }
          });

          if (adminResponse.status === 409) {
            // If admin already exists, try login again
            console.log('Admin user already exists, trying login again...');
            adminResponse = http.post(`${AUTH_URL}/auth/login`, JSON.stringify({
              email: 'admin@example.com',
              password: 'admin123'
            }), {
              headers: { 'Content-Type': 'application/json' }
            });
          }

          if (adminResponse.status !== 201 && adminResponse.status !== 200) {
            throw new Error(`Failed to create/login admin: ${adminResponse.body}`);
          }
          console.log('Admin user created/logged in successfully');
        }
      } catch (error) {
        throw new Error(`Auth service error: ${adminResponse.body}`);
      }

      const adminData = JSON.parse(adminResponse.body);
      if (!adminData.access_token) {
        throw new Error('No access token in admin response');
      }

      // 2. Create test concert
      console.log('Creating test concert...');
      const concertPayload = {
        name: 'Load Test Concert',
        artist: 'Test Artist',
        venue: 'Test Venue',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        endTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),  // Tomorrow + 1 hour
        description: 'This is a test concert for load testing',
        imageUrl: 'https://example.com/test-image.jpg',
        isActive: true,
        seatTypes: []
      };

      console.log('Sending concert creation request to:', `${CONCERT_URL}/concerts`);
      console.log('Concert payload:', JSON.stringify(concertPayload, null, 2));
      console.log('Using admin token:', adminData.access_token);

      const concertRes = http.post(
        `${CONCERT_URL}/concerts`,
        JSON.stringify(concertPayload),
        {
          headers: {
            'Authorization': `Bearer ${adminData.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Concert creation response status:', concertRes.status);
      console.log('Concert creation response body:', concertRes.body);

      if (concertRes.status !== 201) {
        console.error('Failed to create concert:', concertRes.body);
        throw new Error(`Failed to create concert: ${concertRes.body}`);
      }

      const concertData = JSON.parse(concertRes.body);
      const concertId = concertData.id;
      console.log('Created concert with ID:', concertId);

      // 3. Create seat types for the concert
      console.log('Creating seat types...');
      const seatTypes = [
        { 
          name: 'VIP', 
          price: 100, 
          capacity: 1000,
          description: 'VIP seats with premium view'
        },
        { 
          name: 'STANDARD', 
          price: 50, 
          capacity: 2000,
          description: 'Standard seats with good view'
        },
        { 
          name: 'ECONOMY', 
          price: 25, 
          capacity: 3000,
          description: 'Economy seats with basic view'
        }
      ];

      console.log('Sending seat type creation request to:', `${CONCERT_URL}/concerts/${concertId}/seat-types`);
      console.log('Seat types payload:', JSON.stringify({ seatTypes }, null, 2));

      const seatTypeRes = http.post(
        `${CONCERT_URL}/concerts/${concertId}/seat-types`,
        JSON.stringify({ seatTypes }),
        {
          headers: {
            'Authorization': `Bearer ${adminData.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Seat type creation response status:', seatTypeRes.status);
      console.log('Seat type creation response body:', seatTypeRes.body);

      if (seatTypeRes.status !== 201) {
        console.error('Failed to create seat types:', seatTypeRes.body);
        throw new Error(`Failed to create seat types: ${seatTypeRes.body}`);
      }

      console.log('Successfully created seat types');

      // Get seat type IDs from seat type creation response
      const seatTypeResponse = JSON.parse(seatTypeRes.body);
      const createdSeatTypeIds = seatTypeResponse.seatTypes.filter(id => id.length > 3); // Filter out the string names
      console.log('Using seat type IDs from seat type creation:', createdSeatTypeIds);

      if (createdSeatTypeIds.length === 0) {
        throw new Error('No valid seat type IDs found');
      }

      // 4. Create test users
      console.log('Creating test users...');
      const testUsers = [];
      const TOTAL_USERS = 1000;
      const BATCH_SIZE = 10; // Create 10 users at a time
      const DELAY_BETWEEN_BATCHES = 1; // 1 second delay between batches
      const DELAY_BEFORE_LOGIN = 0.5; // 0.5 second delay before login verification
      
      for (let i = 0; i < TOTAL_USERS; i += BATCH_SIZE) {
        const batch = [];
        const loginBatch = [];
        
        // Prepare registration batch
        for (let j = 0; j < BATCH_SIZE && i + j < TOTAL_USERS; j++) {
          const userPayload = {
            name: `Test User ${i + j}`,
            email: `test${i + j}@example.com`,
            password: 'password123'
          };
          batch.push({
            method: 'POST',
            url: `${AUTH_URL}/auth/register`,
            body: JSON.stringify(userPayload),
            params: {
              headers: { 'Content-Type': 'application/json' }
            }
          });
        }

        // Send registration batch
        const responses = http.batch(batch);
        
        // Prepare login batch for successful registrations
        responses.forEach((res, index) => {
          if (res.status === 201 || res.status === 409) {
            loginBatch.push({
              method: 'POST',
              url: `${AUTH_URL}/auth/login`,
              body: JSON.stringify({
                email: `test${i + index}@example.com`,
                password: 'password123'
              }),
              params: {
                headers: { 'Content-Type': 'application/json' }
              }
            });
          } else {
            console.warn(`Failed to create user ${i + index}: ${res.body}`);
          }
        });

        // Wait a bit before login batch
        sleep(DELAY_BEFORE_LOGIN);

        // Send login batch
        const loginResponses = http.batch(loginBatch);
        
        // Process login responses
        loginResponses.forEach((res, index) => {
          if (res.status === 200 || res.status === 201) {
            testUsers.push({
              email: `test${i + index}@example.com`,
              password: 'password123'
            });
            console.log(`User ${i + index} verified (new or existing)`);
          } else {
            console.warn(`User ${i + index} exists but login failed: ${res.body}`);
          }
        });

        // Wait between batches
        sleep(DELAY_BETWEEN_BATCHES);
        
        // Log progress
        if ((i + BATCH_SIZE) % 100 === 0) {
          console.log(`Verified ${testUsers.length} users so far...`);
        }
      }

      if (testUsers.length === 0) {
        throw new Error('Failed to verify any test users');
      }

      console.log(`Successfully verified ${testUsers.length} test users`);

      // Return test data
      return {
        concertId,
        testUsers,
        seatTypeIds: createdSeatTypeIds
      };
    } catch (error) {
      console.error(`Retry ${retryCount + 1} failed:`, error.message);
      retryCount++;
      if (retryCount < maxRetries) {
        console.log(`Retrying in ${retryCount * 1000} milliseconds...`);
        sleep(retryCount * 1000);
      } else {
        throw error;
      }
    }
  }
} 