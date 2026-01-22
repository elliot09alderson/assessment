import { Shipment, IShipmentDocument } from '../models/index.js';
import { carrierApiService } from './carrier.service.js';
import { logger } from '../utils/logger.js';
import { NotFoundError } from '../utils/errors.js';
import { config } from '../config/index.js';
import {
  IShipment,
  ICreateShipmentInput,
  IUpdateShipmentInput,
  IShipmentFilters,
  IPaginationOptions,
  IPaginatedResponse,
  ShipmentStatus,
} from '../interfaces/index.js';

export class ShipmentService {
  /**
   * Create a new shipment
   */
  async createShipment(
    data: ICreateShipmentInput,
    registerWithCarrier: boolean = true
  ): Promise<IShipment> {
    const shipment = new Shipment({
      orderId: data.orderId,
      customerName: data.customerName,
      destination: data.destination,
      status: data.status || ShipmentStatus.PENDING,
    });

    await shipment.save();
    logger.info('Shipment created', { id: shipment.id, orderId: shipment.orderId });

    // Optionally register with carrier API
    if (registerWithCarrier) {
      try {
        await carrierApiService.registerShipment({
          orderId: shipment.orderId,
          customerName: shipment.customerName,
          destination: shipment.destination,
        });
        
        shipment.lastSyncedAt = new Date();
        await shipment.save();
      } catch (error) {
        logger.warn('Failed to register shipment with carrier', {
          id: shipment.id,
          error: (error as Error).message,
        });
        // Don't fail the creation, carrier sync will retry later
      }
    }

    return shipment.toJSON() as IShipment;
  }

  /**
   * Get shipment by ID
   */
  async getShipmentById(id: string): Promise<IShipment> {
    const shipment = await Shipment.findById(id);
    
    if (!shipment) {
      throw NotFoundError('Shipment');
    }

    return shipment.toJSON() as IShipment;
  }

  /**
   * Update shipment
   */
  async updateShipment(id: string, data: IUpdateShipmentInput): Promise<IShipment> {
    const shipment = await Shipment.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!shipment) {
      throw NotFoundError('Shipment');
    }

    logger.info('Shipment updated', { id, updates: Object.keys(data) });
    return shipment.toJSON() as IShipment;
  }

  /**
   * Delete shipment
   */
  async deleteShipment(id: string): Promise<void> {
    const shipment = await Shipment.findByIdAndDelete(id);
    
    if (!shipment) {
      throw NotFoundError('Shipment');
    }

    logger.info('Shipment deleted', { id });
  }

  /**
   * List shipments with pagination and filters
   */
  async listShipments(
    filters: IShipmentFilters,
    pagination: IPaginationOptions
  ): Promise<IPaginatedResponse<IShipment>> {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    // Build query
    const query: Record<string, unknown> = {};
    
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.customerName) {
      query.customerName = { $regex: filters.customerName, $options: 'i' };
    }
    if (filters.orderId) {
      query.orderId = { $regex: filters.orderId, $options: 'i' };
    }
    if (filters.destination) {
      query.destination = { $regex: filters.destination, $options: 'i' };
    }

    // Execute queries
    const [shipments, total] = await Promise.all([
      Shipment.find(query)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Shipment.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: shipments.map((s) => ({
        id: s._id,
        orderId: s.orderId,
        customerName: s.customerName,
        destination: s.destination,
        status: s.status,
        lastSyncedAt: s.lastSyncedAt,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })) as IShipment[],
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Get pending shipments for sync
   */
  async getPendingShipments(batchSize: number = config.sync.batchSize): Promise<IShipmentDocument[]> {
    return Shipment.find({
      status: { $in: [ShipmentStatus.PENDING, ShipmentStatus.IN_TRANSIT] },
    })
      .sort({ lastSyncedAt: 1 })
      .limit(batchSize);
  }

  /**
   * Update shipment status from carrier
   */
  async updateShipmentFromCarrier(
    shipment: IShipmentDocument,
    newStatus: ShipmentStatus
  ): Promise<void> {
    shipment.status = newStatus;
    shipment.lastSyncedAt = new Date();
    await shipment.save();
  }
}

// Export singleton instance
export const shipmentService = new ShipmentService();
