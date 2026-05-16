import { PrismaClient } from "../../../node_modules/.prisma/client/catalog"; 

const prisma = new PrismaClient();

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
          sellerId: 2,
        },
        {
          title: 'Sony PlayStation 5',
          description: 'Next-gen gaming console',
          basePrice: 499.99,
          stockQuantity: 50,
          tags: ['gaming', 'console', 'sony'],
          sellerId: 2,
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
  .catch(async (e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });