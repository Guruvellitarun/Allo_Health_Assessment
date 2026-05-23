export type ProductStock = {
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  priceInr: number;
  totalUnits: number;
  reservedUnits: number;
  availableUnits: number;
  reservableUnits: number;
};

export type ProductListItem = {
  id: string;
  sku: string;
  name: string;
  imageUrl: string | null;
  stocks: ProductStock[];
};
