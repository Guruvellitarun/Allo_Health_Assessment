import { NextResponse } from "next/server";
import { ReservationCreateSchema } from "@/types/reservation";
import { listRecentReservations, reserveInventory } from "@/services/reservation.service";

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(50, Math.max(1, Number(limitParam))) : 20;

  const reservations = await listRecentReservations(limit);
  return NextResponse.json({ data: reservations });
};

export const POST = async (request: Request) => {
  const body = await request.json();
  const parsed = ReservationCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({
      message: "Invalid payload",
      issues: parsed.error.flatten().fieldErrors,
    }, { status: 400 });
  }

  const idempotencyKey = request.headers.get("Idempotency-Key");
  const result = await reserveInventory(parsed.data, idempotencyKey);
  return NextResponse.json(result.body, { status: result.status });
};
