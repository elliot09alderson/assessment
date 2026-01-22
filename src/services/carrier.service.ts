import axios, { AxiosInstance, AxiosError } from 'axios';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { withRetry, isRetryableError, isRetryableStatusCode } from '../utils/retry.js';
import { ExternalApiError } from '../utils/errors.js';
import {
  ICarrierShipmentResponse,
  ICarrierCreateShipmentRequest,
  ICarrierUpdateShipmentRequest,
  ShipmentStatus,
} from '../interfaces/index.js';

// Map external status to internal status
const statusMapping: Record<string, ShipmentStatus> = {
  pending: ShipmentStatus.PENDING,
  in_transit: ShipmentStatus.IN_TRANSIT,
  'in-transit': ShipmentStatus.IN_TRANSIT,
  delivered: ShipmentStatus.DELIVERED,
  failed: ShipmentStatus.FAILED,
  cancelled: ShipmentStatus.FAILED,
};

export class CarrierApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.carrierApi.baseUrl,
      timeout: config.carrierApi.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (requestConfig) => {
        logger.debug('Carrier API request', {
          method: requestConfig.method?.toUpperCase(),
          url: requestConfig.url,
        });
        return requestConfig;
      },
      (error) => {
        logger.error('Carrier API request error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.debug('Carrier API response', {
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      (error: AxiosError) => {
        logger.error('Carrier API response error', {
          status: error.response?.status,
          message: error.message,
          url: error.config?.url,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get shipment status from carrier API with retry logic
   */
  async getShipmentStatus(shipmentId: string): Promise<ICarrierShipmentResponse | null> {
    try {
      const response = await withRetry(
        () => this.client.get<ICarrierShipmentResponse>(`/carrier/shipments/${shipmentId}`),
        {
          maxRetries: config.sync.maxRetries,
          initialDelayMs: config.sync.retryDelayMs,
          retryCondition: (error) => {
            if (error instanceof AxiosError) {
              if (error.response?.status === 404) return false;
              return isRetryableStatusCode(error.response?.status || 0) || isRetryableError(error);
            }
            return isRetryableError(error);
          },
        }
      );

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        logger.warn(`Shipment ${shipmentId} not found in carrier API`);
        return null;
      }
      throw new ExternalApiError(`Failed to get shipment status: ${(error as Error).message}`);
    }
  }

  /**
   * Register new shipment with carrier API
   */
  async registerShipment(data: ICarrierCreateShipmentRequest): Promise<ICarrierShipmentResponse> {
    try {
      const response = await withRetry(
        () => this.client.post<ICarrierShipmentResponse>('/carrier/shipments', data),
        {
          maxRetries: config.sync.maxRetries,
          initialDelayMs: config.sync.retryDelayMs,
          retryCondition: (error) => {
            if (error instanceof AxiosError) {
              return isRetryableStatusCode(error.response?.status || 0) || isRetryableError(error);
            }
            return isRetryableError(error);
          },
        }
      );

      logger.info('Shipment registered with carrier API', { orderId: data.orderId });
      return response.data;
    } catch (error) {
      throw new ExternalApiError(`Failed to register shipment: ${(error as Error).message}`);
    }
  }

  /**
   * Update shipment with carrier API
   */
  async updateShipment(
    shipmentId: string,
    data: ICarrierUpdateShipmentRequest
  ): Promise<ICarrierShipmentResponse> {
    try {
      const response = await withRetry(
        () => this.client.patch<ICarrierShipmentResponse>(`/carrier/shipments/${shipmentId}`, data),
        {
          maxRetries: config.sync.maxRetries,
          initialDelayMs: config.sync.retryDelayMs,
          retryCondition: (error) => {
            if (error instanceof AxiosError) {
              return isRetryableStatusCode(error.response?.status || 0) || isRetryableError(error);
            }
            return isRetryableError(error);
          },
        }
      );

      logger.info('Shipment updated with carrier API', { shipmentId });
      return response.data;
    } catch (error) {
      throw new ExternalApiError(`Failed to update shipment: ${(error as Error).message}`);
    }
  }

  /**
   * Map external carrier status to internal status
   */
  mapCarrierStatus(externalStatus: string): ShipmentStatus {
    const normalizedStatus = externalStatus.toLowerCase().trim();
    return statusMapping[normalizedStatus] || ShipmentStatus.PENDING;
  }
}

// Export singleton instance
export const carrierApiService = new CarrierApiService();
