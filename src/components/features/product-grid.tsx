"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WarehouseStockTable } from "@/components/features/warehouse-stock-table";
import type { ProductListItem } from "@/types/product";

type ProductGridProps = {
  products: ProductListItem[];
  isLoading: boolean;
  onReserve: (productId: string, warehouseId: string, quantity: number) => void;
};

export const ProductGrid = ({
  products,
  isLoading,
  onReserve,
}: ProductGridProps) => {
  const [quantities, setQuantities] = React.useState<Record<string, number>>({});

  const handleQuantityChange = (key: string, value: number) => {
    setQuantities((prev) => ({
      ...prev,
      [key]: Number.isNaN(value) ? 1 : Math.max(1, value),
    }));
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {products.map((product) => (
        <Card key={product.id} className="overflow-hidden">
          <CardHeader className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>{product.name}</CardTitle>
                <p className="text-xs text-[var(--muted)]">SKU: {product.sku}</p>
              </div>
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-14 w-20 rounded-md object-cover"
                />
              ) : (
                <div className="h-14 w-20 rounded-md bg-[var(--bg-spot)] text-xs text-[var(--muted)] flex items-center justify-center">
                  Image
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <WarehouseStockTable
              productId={product.id}
              stocks={product.stocks}
              quantities={quantities}
              onQuantityChange={handleQuantityChange}
              onReserve={(warehouseId, quantity) =>
                onReserve(product.id, warehouseId, quantity)
              }
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
