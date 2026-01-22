import { Request, Response } from 'express';
import { shipmentService } from '../services/index.js';
import { IApiResponse } from '../interfaces/index.js';
import { CreateShipmentInput, UpdateShipmentInput, ListShipmentsQuery } from '../utils/validation.js';

export class ShipmentController {
  /**
   * Create a new shipment
   * POST /shipments
   */
  async createShipment(req: Request, res: Response): Promise<void> {
    const data: CreateShipmentInput = req.body;
    const registerWithCarrier = req.query.registerWithCarrier !== 'false';

    const shipment = await shipmentService.createShipment(data, registerWithCarrier);

    const response: IApiResponse = {
      success: true,
      message: 'Shipment created successfully',
      data: shipment,
    };

    res.status(201).json(response);
  }

  /**
   * Get shipment by ID
   * GET /shipments/:id
   */
  async getShipmentById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const shipment = await shipmentService.getShipmentById(id);

    const response: IApiResponse = {
      success: true,
      message: 'Shipment retrieved successfully',
      data: shipment,
    };

    res.status(200).json(response);
  }

  /**
   * Update shipment
   * PUT /shipments/:id
   */
  async updateShipment(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const data: UpdateShipmentInput = req.body;

    const shipment = await shipmentService.updateShipment(id, data);

    const response: IApiResponse = {
      success: true,
      message: 'Shipment updated successfully',
      data: shipment,
    };

    res.status(200).json(response);
  }

  /**
   * Delete shipment
   * DELETE /shipments/:id
   */
  async deleteShipment(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    await shipmentService.deleteShipment(id);

    const response: IApiResponse = {
      success: true,
      message: 'Shipment deleted successfully',
    };

    res.status(200).json(response);
  }

  /**
   * List shipments with pagination and filters
   * GET /shipments
   */
  async listShipments(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as ListShipmentsQuery;

    const { page, limit, sortBy, sortOrder, ...filters } = query;

    const result = await shipmentService.listShipments(filters, {
      page,
      limit,
      sortBy,
      sortOrder,
    });

    const response: IApiResponse = {
      success: true,
      message: 'Shipments retrieved successfully',
      data: result,
    };

    res.status(200).json(response);
  }
}

// Export singleton instance
export const shipmentController = new ShipmentController();
