import { z } from 'zod';
import { ShipmentStatus } from '../interfaces/index.js';

// Shipment status enum for Zod
const shipmentStatusEnum = z.enum([
  ShipmentStatus.PENDING,
  ShipmentStatus.IN_TRANSIT,
  ShipmentStatus.DELIVERED,
  ShipmentStatus.FAILED,
]);

// Create shipment validation schema
export const createShipmentSchema = z.object({
  body: z.object({
    orderId: z
      .string({
        required_error: 'Order ID is required',
        invalid_type_error: 'Order ID must be a string',
      })
      .min(1, 'Order ID cannot be empty')
      .max(100, 'Order ID cannot exceed 100 characters')
      .trim(),
    customerName: z
      .string({
        required_error: 'Customer name is required',
        invalid_type_error: 'Customer name must be a string',
      })
      .min(1, 'Customer name cannot be empty')
      .max(200, 'Customer name cannot exceed 200 characters')
      .trim(),
    destination: z
      .string({
        required_error: 'Destination is required',
        invalid_type_error: 'Destination must be a string',
      })
      .min(1, 'Destination cannot be empty')
      .max(500, 'Destination cannot exceed 500 characters')
      .trim(),
    status: shipmentStatusEnum.optional().default(ShipmentStatus.PENDING),
  }),
});

// Update shipment validation schema
export const updateShipmentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid shipment ID format'),
  }),
  body: z.object({
    orderId: z
      .string()
      .min(1, 'Order ID cannot be empty')
      .max(100, 'Order ID cannot exceed 100 characters')
      .trim()
      .optional(),
    customerName: z
      .string()
      .min(1, 'Customer name cannot be empty')
      .max(200, 'Customer name cannot exceed 200 characters')
      .trim()
      .optional(),
    destination: z
      .string()
      .min(1, 'Destination cannot be empty')
      .max(500, 'Destination cannot exceed 500 characters')
      .trim()
      .optional(),
    status: shipmentStatusEnum.optional(),
  }).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field must be provided for update' }
  ),
});

// Get shipment by ID validation schema
export const getShipmentByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid shipment ID format'),
  }),
});

// List shipments validation schema
export const listShipmentsSchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .pipe(z.number().int().positive('Page must be a positive integer')),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10))
      .pipe(z.number().int().min(1).max(100, 'Limit cannot exceed 100')),
    status: shipmentStatusEnum.optional(),
    customerName: z.string().max(200).optional(),
    orderId: z.string().max(100).optional(),
    destination: z.string().max(500).optional(),
    sortBy: z
      .enum(['createdAt', 'updatedAt', 'customerName', 'status', 'orderId'])
      .optional()
      .default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

// Sync validation schema
export const syncSchema = z.object({
  query: z.object({
    shipmentId: z.string().uuid('Invalid shipment ID format').optional(),
    forceSync: z
      .string()
      .optional()
      .transform((val) => val === 'true'),
  }),
});

// Type exports
export type CreateShipmentInput = z.infer<typeof createShipmentSchema>['body'];
export type UpdateShipmentInput = z.infer<typeof updateShipmentSchema>['body'];
export type ListShipmentsQuery = z.infer<typeof listShipmentsSchema>['query'];
export type SyncQuery = z.infer<typeof syncSchema>['query'];
