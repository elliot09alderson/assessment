import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { Shipment } from '../src/models/index.js';
import { ShipmentStatus } from '../src/interfaces/index.js';

describe('Shipment API Endpoints', () => {
  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fasttrack_test';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Clean up and disconnect
    await Shipment.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear shipments before each test
    await Shipment.deleteMany({});
  });

  describe('POST /api/shipments', () => {
    it('should create a new shipment', async () => {
      const shipmentData = {
        orderId: 'ORD-TEST-001',
        customerName: 'Test Customer',
        destination: '123 Test Street, Test City, TC 12345',
      };

      const response = await request(app)
        .post('/api/shipments?registerWithCarrier=false')
        .send(shipmentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        orderId: shipmentData.orderId,
        customerName: shipmentData.customerName,
        destination: shipmentData.destination,
        status: ShipmentStatus.PENDING,
      });
      expect(response.body.data.id).toBeDefined();
    });

    it('should return validation error for missing required fields', async () => {
      const response = await request(app)
        .post('/api/shipments')
        .send({ orderId: 'ORD-001' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should create shipment with custom status', async () => {
      const shipmentData = {
        orderId: 'ORD-TEST-002',
        customerName: 'Test Customer 2',
        destination: '456 Test Avenue',
        status: ShipmentStatus.IN_TRANSIT,
      };

      const response = await request(app)
        .post('/api/shipments?registerWithCarrier=false')
        .send(shipmentData)
        .expect(201);

      expect(response.body.data.status).toBe(ShipmentStatus.IN_TRANSIT);
    });
  });

  describe('GET /api/shipments', () => {
    beforeEach(async () => {
      // Create test shipments
      await Shipment.create([
        {
          orderId: 'ORD-001',
          customerName: 'Customer A',
          destination: 'Destination A',
          status: ShipmentStatus.PENDING,
        },
        {
          orderId: 'ORD-002',
          customerName: 'Customer B',
          destination: 'Destination B',
          status: ShipmentStatus.IN_TRANSIT,
        },
        {
          orderId: 'ORD-003',
          customerName: 'Customer C',
          destination: 'Destination C',
          status: ShipmentStatus.DELIVERED,
        },
      ]);
    });

    it('should list all shipments with pagination', async () => {
      const response = await request(app)
        .get('/api/shipments')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(3);
      expect(response.body.data.pagination).toMatchObject({
        total: 3,
        page: 1,
        limit: 10,
      });
    });

    it('should filter shipments by status', async () => {
      const response = await request(app)
        .get('/api/shipments?status=pending')
        .expect(200);

      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].status).toBe(ShipmentStatus.PENDING);
    });

    it('should filter shipments by customer name', async () => {
      const response = await request(app)
        .get('/api/shipments?customerName=Customer A')
        .expect(200);

      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].customerName).toBe('Customer A');
    });

    it('should paginate results correctly', async () => {
      const response = await request(app)
        .get('/api/shipments?page=1&limit=2')
        .expect(200);

      expect(response.body.data.data).toHaveLength(2);
      expect(response.body.data.pagination).toMatchObject({
        total: 3,
        page: 1,
        limit: 2,
        totalPages: 2,
        hasNextPage: true,
        hasPrevPage: false,
      });
    });
  });

  describe('GET /api/shipments/:id', () => {
    let testShipmentId: string;

    beforeEach(async () => {
      const shipment = await Shipment.create({
        orderId: 'ORD-TEST',
        customerName: 'Test Customer',
        destination: 'Test Destination',
        status: ShipmentStatus.PENDING,
      });
      testShipmentId = shipment.id;
    });

    it('should get a specific shipment by ID', async () => {
      const response = await request(app)
        .get(`/api/shipments/${testShipmentId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testShipmentId);
      expect(response.body.data.orderId).toBe('ORD-TEST');
    });

    it('should return 404 for non-existent shipment', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440099';
      const response = await request(app)
        .get(`/api/shipments/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return validation error for invalid UUID', async () => {
      const response = await request(app)
        .get('/api/shipments/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /api/shipments/:id', () => {
    let testShipmentId: string;

    beforeEach(async () => {
      const shipment = await Shipment.create({
        orderId: 'ORD-UPDATE',
        customerName: 'Original Customer',
        destination: 'Original Destination',
        status: ShipmentStatus.PENDING,
      });
      testShipmentId = shipment.id;
    });

    it('should update a shipment', async () => {
      const updateData = {
        customerName: 'Updated Customer',
        status: ShipmentStatus.IN_TRANSIT,
      };

      const response = await request(app)
        .put(`/api/shipments/${testShipmentId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.customerName).toBe('Updated Customer');
      expect(response.body.data.status).toBe(ShipmentStatus.IN_TRANSIT);
    });

    it('should return 404 when updating non-existent shipment', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440099';
      const response = await request(app)
        .put(`/api/shipments/${fakeId}`)
        .send({ customerName: 'Updated' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/shipments/:id', () => {
    let testShipmentId: string;

    beforeEach(async () => {
      const shipment = await Shipment.create({
        orderId: 'ORD-DELETE',
        customerName: 'Delete Customer',
        destination: 'Delete Destination',
        status: ShipmentStatus.PENDING,
      });
      testShipmentId = shipment.id;
    });

    it('should delete a shipment', async () => {
      const response = await request(app)
        .delete(`/api/shipments/${testShipmentId}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify deletion
      const deletedShipment = await Shipment.findById(testShipmentId);
      expect(deletedShipment).toBeNull();
    });

    it('should return 404 when deleting non-existent shipment', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440099';
      const response = await request(app)
        .delete(`/api/shipments/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('FastTrack API is running');
    });
  });
});
