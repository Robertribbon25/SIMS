import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import SparePart from './models/SparePart.js';
import StockIn from './models/StockIn.js';
import StockOut from './models/StockOut.js';

dotenv.config();

const seedDB = async () => {
  try {
    console.log('🔄 Initializing database connection for seeding...');
    await connectDB();

    console.log('🧹 Formatting database models and cleaning records...');
    await User.deleteMany({});
    await SparePart.deleteMany({});
    await StockIn.deleteMany({});
    await StockOut.deleteMany({});

    console.log('👤 Injecting System Admin representative credentials...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin123@', salt);

    const admin = await User.create({
      username: 'System Admin',
      email: 'admin@gmail.com',
      password: hashedPassword,
    });
    console.log(`✅ Admin representative registered: ${admin.email}`);

    console.log('⚙️ Injecting standard automotive spare parts catalog items...');
    const parts = [
      {
        name: 'Spark Plug Bosch X5',
        category: 'Engine Parts',
        quantity: 120,
        unitPrice: 4500,
        totalPrice: 540000,
      },
      {
        name: 'Oil Filter Sakura',
        category: 'Filters',
        quantity: 85,
        unitPrice: 3200,
        totalPrice: 272000,
      },
      {
        name: 'Front Brake Pads Toyota',
        category: 'Braking System',
        quantity: 50,
        unitPrice: 12500,
        totalPrice: 625000,
      },
      {
        name: 'AC Belts Mitsuboshi',
        category: 'Belts & Chains',
        quantity: 95,
        unitPrice: 1800,
        totalPrice: 171000,
      },
      {
        name: 'Fuel Filter G5',
        category: 'Filters',
        quantity: 40,
        unitPrice: 5500,
        totalPrice: 220000,
      },
      {
        name: 'Shock Absorber Kayaba',
        category: 'Suspension',
        quantity: 24,
        unitPrice: 28000,
        totalPrice: 672000,
      },
    ];

    const createdParts = await SparePart.insertMany(parts);
    console.log(`✅ Seeded ${createdParts.length} distinct spare parts successfully.`);

    console.log('📊 Establishing catalog restocking (Stock In) records log...');
    for (const part of createdParts) {
      await StockIn.create({
        sparePart: part._id,
        stockInQuantity: part.quantity,
        stockInDate: new Date(),
      });
    }
    console.log('✅ Catalog restocking logs written successfully.');

    console.log('🎉 SYSTEM PERSISTED DATA SEED COMPLETED SUCCESSFULLY!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Data seed process critical failure:', error.message);
    process.exit(1);
  }
};

seedDB();
