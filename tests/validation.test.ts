import { describe, it, expect } from '@jest/globals';
import {
  createShipmentSchema,
  updateShipmentSchema,
  getShipmentByIdSchema,
  listShipmentsSchema,
} from '../src/utils/validation.js';
import { ShipmentStatus } from '../src/interfaces/index.js';

describe('Validation Schemas', () => {
  describe('createShipmentSchema', () => {
    it('should validate valid shipment data', () => {
      const validData = {
        body: {
          orderId: 'ORD-001',
          customerName: 'John Doe',
          destination: '123 Main St',
        },
        query: {},
        params: {},
      };

      const result = createShipmentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should set default status to pending', () => {
      const validData = {
        body: {
          orderId: 'ORD-001',
          customerName: 'John Doe',
          destination: '123 Main St',
        },
        query: {},
        params: {},
      };

      const result = createShipmentSchema.parse(validData);
      expect(result.body.status).toBe(ShipmentStatus.PENDING);
    });

    it('should reject missing orderId', () => {
      const invalidData = {
        body: {
          customerName: 'John Doe',
          destination: '123 Main St',
        },
        query: {},
        params: {},
      };

      const result = createShipmentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing customerName', () => {
      const invalidData = {
        body: {
          orderId: 'ORD-001',
          destination: '123 Main St',
        },
        query: {},
        params: {},
      };

      const result = createShipmentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing destination', () => {
      const invalidData = {
        body: {
          orderId: 'ORD-001',
          customerName: 'John Doe',
        },
        query: {},
        params: {},
      };

      const result = createShipmentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid status', () => {
      const invalidData = {
        body: {
          orderId: 'ORD-001',
          customerName: 'John Doe',
          destination: '123 Main St',
          status: 'invalid_status',
        },
        query: {},
        params: {},
      };

      const result = createShipmentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept valid status values', () => {
      const statuses = Object.values(ShipmentStatus);

      for (const status of statuses) {
        const validData = {
          body: {
            orderId: 'ORD-001',
            customerName: 'John Doe',
            destination: '123 Main St',
            status,
          },
          query: {},
          params: {},
        };

        const result = createShipmentSchema.safeParse(validData);
        expect(result.success).toBe(true);
      }
    });

    it('should trim whitespace from string fields', () => {
      const dataWithWhitespace = {
        body: {
          orderId: '  ORD-001  ',
          customerName: '  John Doe  ',
          destination: '  123 Main St  ',
        },
        query: {},
        params: {},
      };

      const result = createShipmentSchema.parse(dataWithWhitespace);
      expect(result.body.orderId).toBe('ORD-001');
      expect(result.body.customerName).toBe('John Doe');
      expect(result.body.destination).toBe('123 Main St');
    });
  });

  describe('updateShipmentSchema', () => {
    it('should validate valid update data', () => {
      const validData = {
        params: { id: '550e8400-e29b-41d4-a716-446655440001' },
        body: { customerName: 'Updated Name' },
        query: {},
      };

      const result = updateShipmentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const invalidData = {
        params: { id: 'not-a-uuid' },
        body: { customerName: 'Updated Name' },
        query: {},
      };

      const result = updateShipmentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty update body', () => {
      const invalidData = {
        params: { id: '550e8400-e29b-41d4-a716-446655440001' },
        body: {},
        query: {},
      };

      const result = updateShipmentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should allow partial updates', () => {
      const partialUpdate = {
        params: { id: '550e8400-e29b-41d4-a716-446655440001' },
        body: { status: ShipmentStatus.DELIVERED },
        query: {},
      };

      const result = updateShipmentSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });
  });

  describe('getShipmentByIdSchema', () => {
    it('should validate valid UUID', () => {
      const validData = {
        params: { id: '550e8400-e29b-41d4-a716-446655440001' },
        body: {},
        query: {},
      };

      const result = getShipmentByIdSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const invalidData = {
        params: { id: 'invalid-uuid' },
        body: {},
        query: {},
      };

      const result = getShipmentByIdSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('listShipmentsSchema', () => {
    it('should use default values for pagination', () => {
      const minimalData = {
        query: {},
        body: {},
        params: {},
      };

      const result = listShipmentsSchema.parse(minimalData);
      expect(result.query.page).toBe(1);
      expect(result.query.limit).toBe(10);
      expect(result.query.sortBy).toBe('createdAt');
      expect(result.query.sortOrder).toBe('desc');
    });

    it('should parse string numbers for pagination', () => {
      const dataWithStrings = {
        query: { page: '2', limit: '20' },
        body: {},
        params: {},
      };

      const result = listShipmentsSchema.parse(dataWithStrings);
      expect(result.query.page).toBe(2);
      expect(result.query.limit).toBe(20);
    });

    it('should reject limit over 100', () => {
      const invalidData = {
        query: { limit: '200' },
        body: {},
        params: {},
      };

      const result = listShipmentsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate status filter', () => {
      const validData = {
        query: { status: ShipmentStatus.PENDING },
        body: {},
        params: {},
      };

      const result = listShipmentsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid status filter', () => {
      const invalidData = {
        query: { status: 'invalid_status' },
        body: {},
        params: {},
      };

      const result = listShipmentsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
