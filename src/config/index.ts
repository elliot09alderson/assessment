import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // MongoDB
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/fasttrack',
  
  // External Carrier API
  carrierApi: {
    baseUrl: process.env.CARRIER_API_BASE_URL || 'http://localhost:3001',
    timeout: parseInt(process.env.CARRIER_API_TIMEOUT || '5000', 10),
  },
  
  // Sync Configuration
  sync: {
    intervalCron: process.env.SYNC_INTERVAL_CRON || '*/5 * * * *',
    batchSize: parseInt(process.env.SYNC_BATCH_SIZE || '50', 10),
    maxRetries: parseInt(process.env.SYNC_MAX_RETRIES || '3', 10),
    retryDelayMs: parseInt(process.env.SYNC_RETRY_DELAY_MS || '1000', 10),
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
} as const;

export type Config = typeof config;
