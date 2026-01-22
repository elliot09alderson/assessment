import { Router } from 'express';
import { shipmentController } from '../controllers/index.js';
import { validate } from '../middlewares/index.js';
import {
  createShipmentSchema,
  updateShipmentSchema,
  getShipmentByIdSchema,
  listShipmentsSchema,
} from '../utils/validation.js';

const router = Router();

/**
 * @route   POST /api/shipments
 * @desc    Create a new shipment
 * @access  Public
 */
router.post(
  '/',
  validate(createShipmentSchema),
  shipmentController.createShipment.bind(shipmentController)
);

/**
 * @route   GET /api/shipments
 * @desc    List all shipments with pagination and filters
 * @access  Public
 */
router.get(
  '/',
  validate(listShipmentsSchema),
  shipmentController.listShipments.bind(shipmentController)
);

/**
 * @route   GET /api/shipments/:id
 * @desc    Get a specific shipment by ID
 * @access  Public
 */
router.get(
  '/:id',
  validate(getShipmentByIdSchema),
  shipmentController.getShipmentById.bind(shipmentController)
);

/**
 * @route   PUT /api/shipments/:id
 * @desc    Update a shipment
 * @access  Public
 */
router.put(
  '/:id',
  validate(updateShipmentSchema),
  shipmentController.updateShipment.bind(shipmentController)
);

/**
 * @route   DELETE /api/shipments/:id
 * @desc    Delete a shipment
 * @access  Public
 */
router.delete(
  '/:id',
  validate(getShipmentByIdSchema),
  shipmentController.deleteShipment.bind(shipmentController)
);

export default router;
