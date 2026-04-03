import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
// ІМПОРТ ЗМІНЕНО НА ЛОКАЛЬНИЙ (як вказано в output схеми)
import { PrismaClient } from "../../../node_modules/.prisma/client/catalog"; 

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Start seeding Catalog Service...');

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
          sellerId: 2, // ХАРДКОД ID продавця, який є в Seller Service
        },
        {
          title: 'Sony PlayStation 5',
          description: 'Next-gen gaming console',
          basePrice: 499.99,
          stockQuantity: 50,
          tags: ['gaming', 'console', 'sony'],
          sellerId: 2, // ХАРДКОД ID продавця
        },
      ],
    });
    console.log('Test products created.');
  } else {
    console.log('Products already exist. Skipping product seeding.');
  }

  console.log('Seeding finished for Catalog Service.');
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