import { z } from "zod";

export const ReservationCreateSchema = z.object({
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export type ReservationCreateInput = z.infer<typeof ReservationCreateSchema>;

export type ReservationDetail = {
  id: string;
  status: "pending" | "confirmed" | "released";
  quantity: number;
  expiresAt: string;
  priceInr: number;
  product: {
    id: string;
    sku: string;
    name: string;
  };
  warehouse: {
    id: string;
    code: string;
    name: string;
  };
};

export type ReservationListItem = {
  id: string;
  status: "pending" | "confirmed" | "released";
  quantity: number;
  createdAt: string;
  expiresAt: string;
  updatedAt: string;
  product: {
    sku: string;
    name: string;
  };
  warehouse: {
    code: string;
    name: string;
  };
};
