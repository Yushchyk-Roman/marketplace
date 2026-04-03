import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
// ІМПОРТ ЗМІНЕНО НА ЛОКАЛЬНИЙ (як вказано в output схеми)
import { PrismaClient, Role } from "../../../node_modules/.prisma/client/seller"; 
import * as bcrypt from 'bcrypt';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Start seeding Seller Service...');

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
  console.log(`Seller created: ${seller.email} with ID: ${seller.id}`);

  console.log('Seeding finished for Seller Service.');
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