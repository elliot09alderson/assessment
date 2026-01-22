import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';
import { Shipment } from '../models/index.js';
import { ShipmentStatus } from '../interfaces/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dummy data for generating shipments
const customerNames = [
  'John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Williams', 'Charlie Brown',
  'Diana Prince', 'Edward Norton', 'Fiona Apple', 'George Lucas', 'Helen Troy',
  'Ivan Petrov', 'Julia Roberts', 'Kevin Hart', 'Lisa Simpson', 'Michael Scott',
  'Nancy Drew', 'Oscar Wilde', 'Patricia Moore', 'Quincy Adams', 'Rachel Green',
  'Steve Rogers', 'Tony Stark', 'Uma Thurman', 'Victor Hugo', 'Wendy Darling'
];

const destinations = [
  '123 Main St, New York, NY 10001',
  '456 Oak Ave, Los Angeles, CA 90001',
  '789 Pine Rd, Chicago, IL 60601',
  '321 Elm Blvd, Houston, TX 77001',
  '654 Maple Dr, Phoenix, AZ 85001',
  '987 Cedar Ln, Philadelphia, PA 19101',
  '147 Birch Way, San Antonio, TX 78201',
  '258 Spruce Ct, San Diego, CA 92101',
  '369 Willow Ave, Dallas, TX 75201',
  '741 Ash St, San Jose, CA 95101',
  '852 Cherry Blvd, Austin, TX 78701',
  '963 Walnut Dr, Jacksonville, FL 32099',
  '159 Hickory Ln, Fort Worth, TX 76101',
  '357 Poplar Rd, Columbus, OH 43201',
  '468 Sycamore Way, Charlotte, NC 28201'
];

const statuses: ShipmentStatus[] = [
  ShipmentStatus.PENDING,
  ShipmentStatus.IN_TRANSIT,
  ShipmentStatus.DELIVERED,
  ShipmentStatus.FAILED
];

// Generate random date within last 30 days
function randomDate(daysBack: number = 30): Date {
  const now = new Date();
  const past = new Date(now.getTime() - Math.random() * daysBack * 24 * 60 * 60 * 1000);
  return past;
}

// Generate dummy shipments
function generateShipments(count: number) {
  const shipments = [];

  for (let i = 1; i <= count; i++) {
    const id = uuidv4();
    const createdAt = randomDate(30);
    const updatedAt = new Date(createdAt.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000);

    // Weight statuses: more pending and in_transit for testing sync
    let status: ShipmentStatus;
    const rand = Math.random();
    if (rand < 0.35) {
      status = ShipmentStatus.PENDING;
    } else if (rand < 0.7) {
      status = ShipmentStatus.IN_TRANSIT;
    } else if (rand < 0.9) {
      status = ShipmentStatus.DELIVERED;
    } else {
      status = ShipmentStatus.FAILED;
    }

    shipments.push({
      id,
      orderId: `ORD-2024-${String(i).padStart(3, '0')}`,
      customerName: customerNames[i % customerNames.length],
      destination: destinations[i % destinations.length],
      status,
      lastSyncedAt: Math.random() > 0.5 ? randomDate(7) : null,
      createdAt,
      updatedAt
    });
  }

  return shipments;
}

// Generate mock carrier data (for json-server)
function generateCarrierData(shipments: any[]) {
  return shipments.map(s => ({
    id: s.id,
    orderId: s.orderId,
    customerName: s.customerName,
    destination: s.destination,
    // Carrier might have different/updated status
    status: Math.random() > 0.3 ? s.status :
            (s.status === ShipmentStatus.PENDING ? ShipmentStatus.IN_TRANSIT :
             s.status === ShipmentStatus.IN_TRANSIT ? ShipmentStatus.DELIVERED : s.status),
    lastUpdated: new Date().toISOString()
  }));
}

async function seed() {
  console.log('🌱 Starting database seed...\n');

  try {
    // Connect to MongoDB
    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing data
    console.log('🗑️  Clearing existing shipments...');
    await Shipment.deleteMany({});
    console.log('✅ Cleared existing data\n');

    // Generate and insert shipments
    const count = 25;
    console.log(`📝 Generating ${count} dummy shipments...`);
    const shipments = generateShipments(count);

    console.log('💾 Inserting shipments into MongoDB...');
    await Shipment.insertMany(shipments);
    console.log(`✅ Inserted ${count} shipments\n`);

    // Update mock-db.json for carrier API
    console.log('📄 Updating mock carrier database...');
    const carrierData = generateCarrierData(shipments);
    const mockDbPath = path.resolve(__dirname, '../../mock-db.json');
    fs.writeFileSync(mockDbPath, JSON.stringify({ shipments: carrierData }, null, 2));
    console.log('✅ Updated mock-db.json\n');

    // Print summary
    console.log('=' .repeat(50));
    console.log('📊 SEED SUMMARY');
    console.log('=' .repeat(50));

    const statusCounts = shipments.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log(`\nTotal shipments: ${count}`);
    console.log('\nBy status:');
    Object.entries(statusCounts).forEach(([status, c]) => {
      console.log(`  - ${status}: ${c}`);
    });

    console.log('\n📋 Sample shipment IDs for testing:');
    shipments.slice(0, 5).forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.id} (${s.status})`);
    });

    console.log('\n✨ Seeding completed successfully!');
    console.log('\n🚀 You can now test the APIs:');
    console.log('   - Swagger UI: http://localhost:3000/api-docs');
    console.log('   - List shipments: GET http://localhost:3000/api/shipments');
    console.log('   - Trigger sync: POST http://localhost:3000/api/sync');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n📦 Disconnected from MongoDB');
  }
}

// Run seed
seed();
