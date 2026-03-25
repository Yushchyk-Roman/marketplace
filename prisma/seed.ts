import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role } from "@prisma/client";
import * as bcrypt from 'bcrypt';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Start seeding...');

  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@marketplace.com' },
    update: {},
    create: {
      email: 'admin@marketplace.com',
      passwordHash: adminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: Role.ADMIN,
    },
  });
  console.log(`Admin created: ${admin.email}`);

  const sellerPassword = await bcrypt.hash('Seller123!', 10);
  const seller = await prisma.user.upsert({
    where: { email: 'seller@marketplace.com' },
    update: {},
    create: {
      email: 'seller@marketplace.com',
      passwordHash: sellerPassword,
      firstName: 'John',
      lastName: 'Seller',
      role: Role.SELLER,
    },
  });
  console.log(`Seller created: ${seller.email}`);

  const existingProducts = await prisma.product.count();
  
  if (existingProducts === 0) {
    await prisma.product.createMany({
      data: [
        {
          title: 'MacBook Pro 16',
          description: 'M3 Max, 36GB RAM, 1TB SSD',
          basePrice: 3499.99,
          stockQuantity: 10,
          tags: ['laptops', 'apple', 'electronics'],
          sellerId: seller.id,
        },
        {
          title: 'Sony PlayStation 5',
          description: 'Next-gen gaming console',
          basePrice: 499.99,
          stockQuantity: 50,
          tags: ['gaming', 'console', 'sony'],
          sellerId: seller.id,
        },
      ],
    });
    console.log('Test products created.');
  } else {
    console.log('Products already exist. Skipping product seeding.');
  }

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });