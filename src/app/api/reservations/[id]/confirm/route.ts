import { NextResponse } from "next/server";
import { confirmReservation } from "@/services/reservation.service";

export const POST = async (
  _request: Request,
  { params }: { params: { id: string } }
) => {
  const idempotencyKey = _request.headers.get("Idempotency-Key");
  const result = await confirmReservation(params.id, idempotencyKey);
  return NextResponse.json(result.body, { status: result.status });
};
