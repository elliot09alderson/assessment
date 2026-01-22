// External carrier API response for shipment
export interface ICarrierShipmentResponse {
  id: string;
  status: string;
  lastUpdated: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
}

// External carrier API request for creating shipment
export interface ICarrierCreateShipmentRequest {
  orderId: string;
  customerName: string;
  destination: string;
}

// External carrier API request for updating shipment
export interface ICarrierUpdateShipmentRequest {
  status?: string;
  destination?: string;
}

// Carrier API error response
export interface ICarrierApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
