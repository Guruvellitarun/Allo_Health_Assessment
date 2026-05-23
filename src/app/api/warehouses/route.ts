import { NextResponse } from "next/server";
import { listWarehouses } from "@/services/warehouse.service";

export const GET = async () => {
  const warehouses = await listWarehouses();
  return NextResponse.json({ data: warehouses });
};
