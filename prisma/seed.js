const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const products = [
  { sku: "SAMSUNG-S26-ULTRA", name: "Samsung S26 Ultra" },
  { sku: "IPHONE-17-PRO-MAX", name: "iPhone 17 Pro Max" },
  { sku: "GOOGLE-PIXEL-10-PRO", name: "Google Pixel 10 Pro" },
  { sku: "SAMSUNG-FOLD-7", name: "Samsung Fold 7" },
];

const warehouses = [
  { code: "BLR-01", name: "Bangalore" },
  { code: "HYD-02", name: "Hyderabad" },
  { code: "BOM-03", name: "Mumbai" },
];

const priceBySku = {
  "SAMSUNG-S26-ULTRA": 129999,
  "IPHONE-17-PRO-MAX": 149999,
  "GOOGLE-PIXEL-10-PRO": 99999,
  "SAMSUNG-FOLD-7": 169999,
};

const priceByWarehouse = {
  "BLR-01": 0,
  "HYD-02": 1500,
  "BOM-03": 2500,
};

const randomUnits = () => 8 + Math.floor(Math.random() * 24);

const run = async () => {
  await prisma.reservation.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany({
    where: { sku: { notIn: products.map((item) => item.sku) } },
  });
  await prisma.warehouse.deleteMany({
    where: { code: { notIn: warehouses.map((item) => item.code) } },
  });

  for (const warehouse of warehouses) {
    await prisma.warehouse.upsert({
      where: { code: warehouse.code },
      update: {},
      create: warehouse,
    });
  }

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        name: product.name,
        imageUrl: `/images/products/${product.sku}.jpg`,
      },
      create: {
        ...product,
        imageUrl: `/images/products/${product.sku}.jpg`,
      },
    });
  }

  const dbProducts = await prisma.product.findMany();
  const dbWarehouses = await prisma.warehouse.findMany();

  for (const product of dbProducts) {
    for (const warehouse of dbWarehouses) {
      await prisma.inventory.upsert({
        where: {
          productId_warehouseId: {
            productId: product.id,
            warehouseId: warehouse.id,
          },
        },
        update: {
          totalUnits: randomUnits(),
          priceInr:
            (priceBySku[product.sku] ?? 99999) +
            (priceByWarehouse[warehouse.code] ?? 0),
        },
        create: {
          productId: product.id,
          warehouseId: warehouse.id,
          totalUnits: randomUnits(),
          reservedUnits: 0,
          priceInr:
            (priceBySku[product.sku] ?? 99999) +
            (priceByWarehouse[warehouse.code] ?? 0),
        },
      });
    }
  }
};

run()
  .then(async () => {
    await prisma.$disconnect();
    // eslint-disable-next-line no-console
    console.log("Seed complete");
  })
  .catch(async (error) => {
    await prisma.$disconnect();
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  });
