<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Monorepo Structure

This project uses a monorepo structure with multiple services:

```
apps/
  auth-service/
  concert-service/
  booking-service/
  notification-service/
libs/
```

## Development

- Install dependencies:
  ```bash
  npm install
  ```
- Start all services in development mode (with hot-reload):
  ```bash
  npm run start:dev
  ```

## Production

- Build all services:
  ```bash
  npm run build
  ```
- Start all services in production mode:
  ```bash
  npm run start:prod
  ```

## Docker Production

- Build and start all services with Docker:
  ```bash
  docker-compose up --build
  ```

## Environment Variables

- Each service has its own `.env` file in `apps/<service>/.env`.
- Example files: `apps/auth-service/.env.example`, etc.
- Copy `.env.example` to `.env` and update values as needed.

## API Testing with Postman

A ready-to-use Postman Collection is provided for API testing: `Concert Booking API.postman_collection.json`.

### How to use:
1. Open Postman and click "Import".
2. Select the file `Concert Booking API.postman_collection.json` from the project root.
3. Create a new environment in Postman and add these variables:
   - `auth_host` (e.g., http://localhost:3001)
   - `concert_host` (e.g., http://localhost:3002)
   - `booking_host` (e.g., http://localhost:3003)
   - `admin_token`, `user_token`, `concertId`, `seatTypeId`, `userId` (as needed)
4. Select the environment and run requests for each service.

This allows you to test Auth, Concert, and Booking APIs independently, even if they run on different ports or hosts.

## Load Testing with k6

This project includes a k6 load test to simulate high-concurrency booking scenarios and ensure the system prevents overbooking and duplicate bookings.

### Scripts location
- `load-test/booking-test.js`: Main k6 test script for booking concurrency
- `load-test/setup.js`: Script to initialize test data (users, concerts, seat types)

### How to run the load test
1. Make sure all services (auth, concert, booking, notification, MongoDB, Redis) are running (e.g., via `docker-compose up`).
2. Install k6 if you haven't:
   ```bash
   brew install k6 # macOS
   # or see https://k6.io/docs/getting-started/installation/
   ```
3. Run the load test:
   ```bash
   k6 run load-test/booking-test.js
   ```

### Interpreting results
- The test simulates 1,000 concurrent users booking tickets.
- Key metrics:
  - `booking_errors`: Rate of failed bookings (should be low if system is correct)
  - `http_req_failed`: Rate of failed HTTP requests
  - `http_req_duration`: Response time percentiles
- Check the summary at the end for threshold violations and overall system performance.

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).
