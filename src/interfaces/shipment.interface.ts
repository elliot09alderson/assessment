// Shipment status enum
export enum ShipmentStatus {
  PENDING = 'pending',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  FAILED = 'failed'
}

// Base shipment interface
export interface IShipment {
  id: string;
  orderId: string;
  customerName: string;
  destination: string;
  status: ShipmentStatus;
  lastSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Shipment creation input
export interface ICreateShipmentInput {
  orderId: string;
  customerName: string;
  destination: string;
  status?: ShipmentStatus;
}

// Shipment update input
export interface IUpdateShipmentInput {
  orderId?: string;
  customerName?: string;
  destination?: string;
  status?: ShipmentStatus;
}

// Shipment query filters
export interface IShipmentFilters {
  status?: ShipmentStatus;
  customerName?: string;
  orderId?: string;
  destination?: string;
}

// Pagination options
export interface IPaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Paginated response
export interface IPaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
