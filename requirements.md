# Concert Booking Platform Requirements

## Problem Statement
You're tasked with building a backend system for a concert ticket booking platform. Each concert offers multiple seat types (e.g., VIP, Regular, Standing), and each seat type has a limited number of tickets.

Your system must support high concurrency while preventing overbooking and duplicate bookings.

## Functional Requirements

### User Management
- [x] Users can register and log in

### Concert Management
- [x] API to list all available concerts
- [x] API to view concert details:
  - [x] All seat types
  - [x] Remaining tickets for each seat type

### Booking Management
- [x] Users can book one ticket per concert
- [x] Must choose a seat type
- [x] Cannot book if tickets are sold out
- [x] System must ensure:
  - [x] No duplicate bookings per user per concert
  - [x] No overbooking, even with high concurrency
  - [x] Bookings are automatically disabled when concert starts

### Notification
- [x] Simulated email confirmation for bookings

## Technical Requirements

### Database
- [x] MongoDB to store:
  - [x] Concerts
  - [x] Seat types
  - [x] Users
  - [x] Bookings

### Caching & Concurrency
- [x] Redis to handle concurrency:
  - [x] Atomic Lua scripts

### Architecture
- [x] Microservices architecture:
  - [x] Auth Service
  - [x] Concert Service
  - [x] Booking Service
  - [x] Notification Service

### Testing
- [ ] Load test with 1,000 users booking concurrently
  - [ ] Using k6, autocannon, or artillery

### Deployment
- [x] Docker compose file for:
  - [x] Application
  - [x] MongoDB
  - [x] Redis

### Documentation
- [x] README.md with:
  - [x] Setup instructions
  - [x] Usage instructions
- [x] Postman Collection for API testing
  - [x] A ready-to-use Postman Collection (`Concert Booking API.postman_collection.json`) is included for API testing.

## Bonus Requirements
- [x] Cancel booking API (free up seats)
- [x] Automatically disable bookings when concert starts

## Implementation Status
- [x] Completed
- [ ] In Progress
- [ ] Not Started 