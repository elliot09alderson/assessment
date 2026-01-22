import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index.js';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FastTrack Logistics API',
      version: '1.0.0',
      description: 'Backend service for FastTrack logistics company - Shipment synchronization with external carrier API',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api`,
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        ShipmentStatus: {
          type: 'string',
          enum: ['pending', 'in_transit', 'delivered', 'failed'],
          description: 'Status of the shipment',
        },
        Shipment: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the shipment',
              example: '550e8400-e29b-41d4-a716-446655440001',
            },
            orderId: {
              type: 'string',
              description: 'Order ID associated with the shipment',
              example: 'ORD-2024-001',
            },
            customerName: {
              type: 'string',
              description: 'Name of the customer',
              example: 'John Doe',
            },
            destination: {
              type: 'string',
              description: 'Delivery destination address',
              example: '123 Main Street, New York, NY 10001',
            },
            status: {
              $ref: '#/components/schemas/ShipmentStatus',
            },
            lastSyncedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Last time shipment was synced with carrier API',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        CreateShipmentRequest: {
          type: 'object',
          required: ['orderId', 'customerName', 'destination'],
          properties: {
            orderId: {
              type: 'string',
              minLength: 1,
              description: 'Order ID associated with the shipment',
              example: 'ORD-2024-001',
            },
            customerName: {
              type: 'string',
              minLength: 1,
              description: 'Name of the customer',
              example: 'John Doe',
            },
            destination: {
              type: 'string',
              minLength: 1,
              description: 'Delivery destination address',
              example: '123 Main Street, New York, NY 10001',
            },
            status: {
              $ref: '#/components/schemas/ShipmentStatus',
            },
          },
        },
        UpdateShipmentRequest: {
          type: 'object',
          properties: {
            orderId: {
              type: 'string',
              minLength: 1,
              description: 'Order ID associated with the shipment',
              example: 'ORD-2024-002',
            },
            customerName: {
              type: 'string',
              minLength: 1,
              description: 'Name of the customer',
              example: 'Jane Doe',
            },
            destination: {
              type: 'string',
              minLength: 1,
              description: 'Delivery destination address',
              example: '456 Oak Avenue, Los Angeles, CA 90001',
            },
            status: {
              $ref: '#/components/schemas/ShipmentStatus',
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
            },
            data: {
              type: 'object',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                },
                details: {
                  type: 'object',
                },
              },
            },
          },
        },
        PaginationInfo: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              description: 'Total number of items',
            },
            page: {
              type: 'integer',
              description: 'Current page number',
            },
            limit: {
              type: 'integer',
              description: 'Items per page',
            },
            totalPages: {
              type: 'integer',
              description: 'Total number of pages',
            },
            hasNextPage: {
              type: 'boolean',
            },
            hasPrevPage: {
              type: 'boolean',
            },
          },
        },
        SyncResult: {
          type: 'object',
          properties: {
            totalProcessed: {
              type: 'integer',
              description: 'Total shipments processed',
            },
            successful: {
              type: 'integer',
              description: 'Successfully synced shipments',
            },
            failed: {
              type: 'integer',
              description: 'Failed sync attempts',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  shipmentId: {
                    type: 'string',
                  },
                  error: {
                    type: 'string',
                  },
                },
              },
            },
            duration: {
              type: 'integer',
              description: 'Sync duration in milliseconds',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
      {
        name: 'Shipments',
        description: 'Shipment management operations',
      },
      {
        name: 'Sync',
        description: 'Synchronization with carrier API',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/config/swagger-docs.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
