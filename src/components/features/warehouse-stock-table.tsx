"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import type { ProductStock } from "@/types/product";

type WarehouseStockTableProps = {
  productId: string;
  stocks: ProductStock[];
  quantities: Record<string, number>;
  onQuantityChange: (key: string, value: number) => void;
  onReserve: (warehouseId: string, quantity: number) => void;
  isLoading: boolean;
};

export const WarehouseStockTable = ({
  productId,
  stocks,
  quantities,
  onQuantityChange,
  onReserve,
  isLoading,
}: WarehouseStockTableProps) => (
  <Table className="min-w-[420px]">
    <TableHead>
      <TableRow>
        <TableHeaderCell>Warehouse</TableHeaderCell>
        <TableHeaderCell className="font-mono text-center">Price</TableHeaderCell>
        <TableHeaderCell className="font-mono text-center">Available</TableHeaderCell>
        <TableHeaderCell className="font-mono text-center">Reserved</TableHeaderCell>
        <TableHeaderCell className="font-mono text-center">Qty</TableHeaderCell>
        <TableHeaderCell />
      </TableRow>
    </TableHead>
    <TableBody>
      {stocks.map((stock) => {
        const key = `${productId}:${stock.warehouseId}`;
        const quantity = quantities[key] ?? 1;
        const disabled = stock.reservableUnits <= 0 || isLoading;
        const priceLabel = `₹${stock.priceInr.toLocaleString("en-IN")}`;

        return (
          <TableRow key={stock.warehouseId}>
            <TableCell>
              <div className="text-sm font-medium">
                {stock.warehouseName}
              </div>
              <div className="text-xs text-[var(--muted)]">
                {stock.warehouseCode}
              </div>
            </TableCell>
            <TableCell className="font-mono text-center">{priceLabel}</TableCell>
            <TableCell className="font-mono text-center">{stock.availableUnits}</TableCell>
            <TableCell className="font-mono text-center">{stock.reservedUnits}</TableCell>
            <TableCell className="text-center">
              <input
                className="w-16 rounded-md border border-[var(--line)] bg-white px-2 py-1 text-sm text-center"
                type="number"
                min={1}
                max={stock.reservableUnits}
                value={quantity}
                onChange={(event) =>
                  onQuantityChange(key, Number(event.target.value))
                }
                disabled={disabled}
              />
            </TableCell>
            <TableCell className="text-center">
              <Button
                size="sm"
                onClick={() => onReserve(stock.warehouseId, quantity)}
                disabled={disabled || quantity <= 0}
              >
                Reserve
              </Button>
            </TableCell>
          </TableRow>
        );
      })}
    </TableBody>
  </Table>
);
