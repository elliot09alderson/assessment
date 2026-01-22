import { Router } from 'express';
import shipmentRoutes from './shipment.routes.js';
import syncRoutes from './sync.routes.js';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'FastTrack API is running',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
router.use('/shipments', shipmentRoutes);
router.use('/sync', syncRoutes);

export default router;
