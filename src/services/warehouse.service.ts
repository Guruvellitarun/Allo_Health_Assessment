import { prisma } from "@/lib/db";
import type { WarehouseListItem } from "@/types/warehouse";

export const listWarehouses = async (): Promise<WarehouseListItem[]> => {
  const warehouses = await prisma.warehouse.findMany({
    orderBy: { code: "asc" },
  });

  return warehouses.map((warehouse) => ({
    id: warehouse.id,
    code: warehouse.code,
    name: warehouse.name,
  }));
};
