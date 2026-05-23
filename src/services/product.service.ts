import { prisma } from "@/lib/db";
import type { ProductListItem } from "@/types/product";

export const listProducts = async (): Promise<ProductListItem[]> => {
  const products = await prisma.product.findMany({
    include: {
      inventories: {
        include: {
          warehouse: true,
        },
      },
    },
    orderBy: { sku: "asc" },
  });

  return products.map((product) => ({
    id: product.id,
    sku: product.sku,
    name: product.name,
    imageUrl: product.imageUrl,
    stocks: product.inventories.map((inventory) => ({
      warehouseId: inventory.warehouseId,
      warehouseCode: inventory.warehouse.code,
      warehouseName: inventory.warehouse.name,
      priceInr: inventory.priceInr,
      totalUnits: inventory.totalUnits,
      reservedUnits: inventory.reservedUnits,
      availableUnits: inventory.totalUnits - inventory.reservedUnits,
      reservableUnits: inventory.totalUnits - inventory.reservedUnits,
    })),
  }));
};
