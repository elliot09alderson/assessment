import { shipmentService } from './shipment.service.js';
import { carrierApiService } from './carrier.service.js';
import { logger } from '../utils/logger.js';
import { ISyncResult } from '../interfaces/index.js';

export class SyncService {
  /**
   * Synchronize all pending shipments with carrier API
   */
  async syncAllShipments(forceSync: boolean = false): Promise<ISyncResult> {
    const startTime = Date.now();
    const result: ISyncResult = {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      errors: [],
      duration: 0,
    };

    try {
      logger.info('Starting shipment synchronization', { forceSync });

      // Get shipments to sync
      const shipments = await shipmentService.getPendingShipments();
      result.totalProcessed = shipments.length;

      if (shipments.length === 0) {
        logger.info('No shipments to synchronize');
        result.duration = Date.now() - startTime;
        return result;
      }

      // Process each shipment
      for (const shipment of shipments) {
        try {
          await this.syncSingleShipment(shipment.id);
          result.successful++;
        } catch (error) {
          result.failed++;
          result.errors.push({
            shipmentId: shipment.id,
            error: (error as Error).message,
          });
          logger.error('Failed to sync shipment', {
            id: shipment.id,
            error: (error as Error).message,
          });
        }
      }

      result.duration = Date.now() - startTime;
      logger.info('Shipment synchronization completed', {
        totalProcessed: result.totalProcessed,
        successful: result.successful,
        failed: result.failed,
        duration: result.duration,
      });

      return result;
    } catch (error) {
      logger.error('Shipment synchronization failed', { error: (error as Error).message });
      result.duration = Date.now() - startTime;
      throw error;
    }
  }

  /**
   * Synchronize a single shipment with carrier API
   */
  async syncSingleShipment(shipmentId: string): Promise<void> {
    logger.debug('Syncing shipment', { shipmentId });

    // Get carrier status
    const carrierResponse = await carrierApiService.getShipmentStatus(shipmentId);

    if (!carrierResponse) {
      logger.warn('Shipment not found in carrier system, registering...', { shipmentId });
      
      // Get local shipment data
      const localShipment = await shipmentService.getShipmentById(shipmentId);
      
      // Register with carrier
      await carrierApiService.registerShipment({
        orderId: localShipment.orderId,
        customerName: localShipment.customerName,
        destination: localShipment.destination,
      });
      
      return;
    }

    // Map and update status
    const newStatus = carrierApiService.mapCarrierStatus(carrierResponse.status);
    
    // Update local shipment
    const shipments = await shipmentService.getPendingShipments(1000);
    const shipment = shipments.find((s) => s.id === shipmentId);
    
    if (shipment) {
      await shipmentService.updateShipmentFromCarrier(shipment, newStatus);
      logger.info('Shipment synced successfully', { shipmentId, newStatus });
    }
  }
}

// Export singleton instance
export const syncService = new SyncService();
