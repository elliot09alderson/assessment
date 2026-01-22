import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IShipment, ShipmentStatus } from '../interfaces/index.js';

// Mongoose document interface
export interface IShipmentDocument extends Omit<IShipment, 'id'>, Document {
  _id: string;
}

// Shipment Schema
const shipmentSchema = new Schema<IShipmentDocument>(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    orderId: {
      type: String,
      required: [true, 'Order ID is required'],
      trim: true,
      index: true,
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      index: true,
    },
    destination: {
      type: String,
      required: [true, 'Destination is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(ShipmentStatus),
      default: ShipmentStatus.PENDING,
      index: true,
    },
    lastSyncedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for common queries
shipmentSchema.index({ status: 1, lastSyncedAt: 1 });
shipmentSchema.index({ customerName: 'text', destination: 'text' });

// Virtual for id
shipmentSchema.virtual('id').get(function () {
  return this._id;
});

export const Shipment = mongoose.model<IShipmentDocument>('Shipment', shipmentSchema);
