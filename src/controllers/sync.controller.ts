import { Request, Response } from 'express';
import { syncService } from '../services/index.js';
import { IApiResponse } from '../interfaces/index.js';
import { SyncQuery } from '../utils/validation.js';

export class SyncController {
  /**
   * Trigger manual synchronization
   * POST /sync
   */
  async triggerSync(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as SyncQuery;

    let result;

    if (query.shipmentId) {
      // Sync single shipment
      await syncService.syncSingleShipment(query.shipmentId);
      result = {
        message: `Shipment ${query.shipmentId} synchronized successfully`,
      };
    } else {
      // Sync all pending shipments
      result = await syncService.syncAllShipments(query.forceSync);
    }

    const response: IApiResponse = {
      success: true,
      message: 'Synchronization completed',
      data: result,
    };

    res.status(200).json(response);
  }
}

// Export singleton instance
export const syncController = new SyncController();
