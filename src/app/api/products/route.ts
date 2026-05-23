import { NextResponse } from "next/server";
import { listProducts } from "@/services/product.service";

export const GET = async () => {
  const products = await listProducts();
  return NextResponse.json({ data: products });
};
