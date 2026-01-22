# FastTrack Logistics API

A  Node.js backend service for synchronizing shipment data between an internal database and an external carrier API. Built with Express, MongoDB, and TypeScript following MVC architecture.

## 🚀 Features

- **Shipment Management**: Full CRUD operations for shipment records
- **External API Integration**: Seamless synchronization with carrier APIs
- **Retry Logic**: Exponential backoff for handling transient failures
- **Scheduled Sync**: Automated periodic synchronization with cron jobs
- **Rate Limiting Handling**: Graceful handling of API rate limits
- **Comprehensive Validation**: Request validation using Zod schemas
- **Logging**: Structured logging with Winston
- **Error Handling**: Centralized error handling with custom error classes
- **Testing**: Jest test suite for API and unit tests
- **API Documentation**: Interactive Swagger UI + Postman Collection

## 📋 Prerequisites

- Node.js >= 24
- MongoDB (local or cloud instance)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd assessment
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

   Update `.env` with your configuration:
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://itsgeekyyashaswi:admin@cluster0.n8f96lb.mongodb.net/fasttrack
   CARRIER_API_BASE_URL=http://localhost:3001
   CARRIER_API_TIMEOUT=5000
   SYNC_INTERVAL_CRON=*/5 * * * *
   LOG_LEVEL=info
   ```

4. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

### Run Mock Carrier API (for testing)
In a separate terminal:
```bash
npm run mock:server
```
This starts a JSON Server on port 3001 that simulates the external carrier API.

### Seed Database with Dummy Data
```bash
npm run seed
```
This inserts 25 dummy shipments with various statuses for testing.

## 📖 API Documentation

### Swagger UI (Interactive)
Once the server is running, access the interactive API documentation at:
```
http://localhost:3000/api-docs
```

You can test all endpoints directly from the Swagger UI.

### OpenAPI JSON
```
http://localhost:3000/api-docs.json
```

### Postman Collection
Import the `postman-collection.json` file into Postman:
1. Open Postman
2. Click **Import** button
3. Select the file: `postman-collection.json`
4. All endpoints are pre-configured with variables

## 🧪 Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

> **Note**: Tests require MongoDB to be running. The test suite uses a separate database (`fasttrack_test`).

## 📚 API Endpoints

### Base URL
```
http://localhost:3000/api
```

### Quick Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/shipments` | Create shipment |
| `GET` | `/shipments` | List shipments (paginated) |
| `GET` | `/shipments/:id` | Get shipment by ID |
| `PUT` | `/shipments/:id` | Update shipment |
| `DELETE` | `/shipments/:id` | Delete shipment |
| `POST` | `/sync` | Trigger manual sync |

---

### Health Check
```http
GET /api/health
```
**Response:**
```json
{
  "success": true,
  "message": "FastTrack API is running",
  "timestamp": "2026-01-21T18:00:00.000Z"
}
```

---

### Create Shipment
```http
POST /api/shipments
```
**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| registerWithCarrier | boolean | true | Register shipment with external carrier API |

**Request Body:**
```json
{
  "orderId": "ORD-001",
  "customerName": "John Doe",
  "destination": "123 Main St, New York, NY 10001",
  "status": "pending"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Shipment created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "orderId": "ORD-001",
    "customerName": "John Doe",
    "destination": "123 Main St, New York, NY 10001",
    "status": "pending",
    "lastSyncedAt": null,
    "createdAt": "2026-01-21T18:00:00.000Z",
    "updatedAt": "2026-01-21T18:00:00.000Z"
  }
}
```

---

### List Shipments
```http
GET /api/shipments
```
**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Items per page (max: 100) |
| status | string | - | Filter by status |
| customerName | string | - | Filter by customer name |
| orderId | string | - | Filter by order ID |
| destination | string | - | Filter by destination |
| sortBy | string | createdAt | Sort field |
| sortOrder | string | desc | Sort order (asc/desc) |

**Response (200):**
```json
{
  "success": true,
  "message": "Shipments retrieved successfully",
  "data": {
    "data": [...],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

### Get Shipment by ID
```http
GET /api/shipments/:id
```

---

### Update Shipment
```http
PUT /api/shipments/:id
```
**Request Body (partial update):**
```json
{
  "customerName": "Jane Doe",
  "status": "in_transit"
}
```

---

### Delete Shipment
```http
DELETE /api/shipments/:id
```

---

### Trigger Manual Sync
```http
POST /api/sync
```
**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| shipmentId | UUID | Sync single shipment (optional) |
| forceSync | boolean | Force sync all shipments |

**Response (200):**
```json
{
  "success": true,
  "message": "Synchronization completed",
  "data": {
    "totalProcessed": 10,
    "successful": 9,
    "failed": 1,
    "errors": [...],
    "duration": 2500
  }
}
```

---

## 🔄 Synchronization Explained

This API acts as a **middleman** between your internal database (MongoDB) and an **external carrier API** (like FedEx, UPS, DHL). The sync feature keeps shipment statuses in sync between both systems.

### System Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Your System   │  ←───→  │  FastTrack API  │  ←───→  │  Carrier API    │
│   (Frontend)    │         │   (This App)    │         │ (FedEx/UPS/DHL) │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

**Problem**: When a carrier updates a shipment status (e.g., "delivered"), your local database doesn't automatically know about it.

**Solution**: Synchronization fetches the latest status from the carrier and updates your local database.

---

### 1. Automatic Sync (Cron Job)

Runs automatically every **5 minutes** (configurable via `SYNC_INTERVAL_CRON` in `.env`).

**How it works:**
```
Every 5 minutes:
  1. Find all shipments with status "pending" or "in_transit"
  2. For each shipment, call carrier API to get latest status
  3. Update local database with new status
  4. Log results
```

**Example Timeline:**
```
10:00 AM - You create shipment (status: "pending")
10:05 AM - Auto-sync runs → Carrier says "in_transit" → DB updated
10:10 AM - Auto-sync runs → Carrier says "in_transit" → No change
10:15 AM - Auto-sync runs → Carrier says "delivered" → DB updated
```

**Configuration:**
```env
SYNC_INTERVAL_CRON=*/5 * * * *   # Every 5 minutes
SYNC_BATCH_SIZE=50                # Process 50 shipments per batch
SYNC_MAX_RETRIES=3                # Retry failed syncs 3 times
SYNC_RETRY_DELAY_MS=1000          # Initial retry delay
```

---

### 2. Manual Sync (API Endpoint)

Triggered on-demand via `POST /api/sync`.

| Scenario | Endpoint | Purpose |
|----------|----------|---------|
| Sync all pending shipments | `POST /api/sync` | Bulk update |
| Sync one specific shipment | `POST /api/sync?shipmentId=<uuid>` | Check one shipment immediately |
| Force sync everything | `POST /api/sync?forceSync=true` | Re-sync all regardless of last sync time |

---

### Practical Examples

#### Example 1: Customer asks "Where's my package?"
```bash
# Immediately sync that specific shipment to get latest status
curl -X POST "http://localhost:3000/api/sync?shipmentId=<shipment-uuid>"

# Then fetch the updated shipment
curl http://localhost:3000/api/shipments/<shipment-uuid>
```

#### Example 2: Daily report needs fresh data
```bash
# Force sync all shipments before generating report
curl -X POST "http://localhost:3000/api/sync?forceSync=true"
```

#### Example 3: Check sync results
```bash
curl -X POST http://localhost:3000/api/sync
```

**Response:**
```json
{
  "success": true,
  "message": "Synchronization completed",
  "data": {
    "totalProcessed": 20,
    "successful": 18,
    "failed": 2,
    "errors": [
      { "shipmentId": "xxx", "error": "Carrier API timeout" }
    ],
    "duration": 3500
  }
}
```

---

### Sync Flow Diagram

```
LOCAL DB                    SYNC SERVICE                 CARRIER API
────────                    ────────────                 ───────────
                                  │
Shipment A: "pending"  ──────────►│
                                  │──── GET /shipments/A ────►
                                  │◄─── { status: "in_transit" }
Shipment A: "in_transit" ◄────────│
                                  │
Shipment B: "in_transit" ─────────►│
                                  │──── GET /shipments/B ────►
                                  │◄─── { status: "delivered" }
Shipment B: "delivered" ◄─────────│
```

---

### Retry Logic

When carrier API calls fail, the system uses **exponential backoff**:

```
Attempt 1: Immediate
Attempt 2: Wait 1 second
Attempt 3: Wait 2 seconds
Attempt 4: Wait 4 seconds
... (up to SYNC_MAX_RETRIES)
```

**Retryable errors:**
- Network timeouts
- HTTP 429 (Rate Limited)
- HTTP 5xx (Server Errors)

**Non-retryable errors:**
- HTTP 404 (Not Found) - Shipment doesn't exist in carrier system
- HTTP 400 (Bad Request) - Invalid request data

---

## 🏗️ Architecture Overview

```
src/
├── config/           # Configuration and database setup
│   ├── index.ts      # Environment configuration
│   ├── database.ts   # MongoDB connection
│   ├── swagger.ts    # Swagger configuration
│   └── swagger-docs.ts # API documentation
├── controllers/      # Request handlers (MVC Controllers)
│   ├── shipment.controller.ts
│   └── sync.controller.ts
├── interfaces/       # TypeScript interfaces
│   ├── shipment.interface.ts
│   ├── carrier.interface.ts
│   └── common.interface.ts
├── middlewares/      # Express middlewares
│   ├── validation.middleware.ts
│   ├── error.middleware.ts
│   └── logger.middleware.ts
├── models/           # Mongoose models (MVC Models)
│   └── shipment.model.ts
├── routes/           # Express routes
│   ├── shipment.routes.ts
│   └── sync.routes.ts
├── services/         # Business logic layer
│   ├── shipment.service.ts
│   ├── carrier.service.ts
│   └── sync.service.ts
├── jobs/             # Scheduled jobs
│   └── sync.job.ts
├── scripts/          # Utility scripts
│   └── seed.ts       # Database seeding
├── utils/            # Utility functions
│   ├── logger.ts     # Winston logger
│   ├── errors.ts     # Custom error classes
│   ├── validation.ts # Zod schemas
│   └── retry.ts      # Retry with backoff
├── app.ts            # Express app setup
└── index.ts          # Entry point
```

## 🎯 Design Choices

1. **MVC Architecture**: Clear separation of concerns with controllers handling requests, services containing business logic, and models managing data.

2. **TypeScript**: Strong typing for better code quality and developer experience.

3. **ES Modules**: Modern JavaScript module system with `import/export`.

4. **Zod Validation**: Schema-based validation with excellent TypeScript integration.

5. **Winston Logger**: Production-ready logging with multiple transports and log levels.

6. **UUID Primary Keys**: Using UUIDs instead of MongoDB ObjectIds for better compatibility with external systems.

7. **Singleton Services**: Services are instantiated once and exported as singletons for consistent state.

8. **Express Async Errors**: Automatic handling of async errors without try-catch in every route.

## 🔧 Configuration Options

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | development |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/fasttrack |
| `CARRIER_API_BASE_URL` | External carrier API URL | http://localhost:3001 |
| `CARRIER_API_TIMEOUT` | API timeout (ms) | 5000 |
| `SYNC_INTERVAL_CRON` | Cron expression for sync | */5 * * * * |
| `SYNC_BATCH_SIZE` | Shipments per sync batch | 50 |
| `SYNC_MAX_RETRIES` | Max retry attempts | 3 |
| `SYNC_RETRY_DELAY_MS` | Initial retry delay | 1000 |
| `LOG_LEVEL` | Logging level | info |

## 📝 Example Requests

### Create a Shipment
```bash
curl -X POST http://localhost:3000/api/shipments \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD-2024-001",
    "customerName": "John Doe",
    "destination": "123 Main Street, New York, NY 10001"
  }'
```

### List Shipments with Filters
```bash
curl "http://localhost:3000/api/shipments?status=pending&page=1&limit=20"
```

### Get Single Shipment
```bash
curl http://localhost:3000/api/shipments/<shipment-id>
```

### Trigger Manual Sync
```bash
curl -X POST http://localhost:3000/api/sync
```

### Sync Single Shipment
```bash
curl -X POST "http://localhost:3000/api/sync?shipmentId=<shipment-id>"
```

## 🐛 Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

### Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `EXTERNAL_API_ERROR` | 502 | External API failure |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

## 🚀 Quick Start

```bash
# Terminal 1: Start MongoDB
mongod

# Terminal 2: Start mock carrier API
npm run mock:server

# Terminal 3: Seed database and start API
npm run seed
npm run dev

# Open Swagger UI
open http://localhost:3000/api-docs
```

## 📄 License

MIT
