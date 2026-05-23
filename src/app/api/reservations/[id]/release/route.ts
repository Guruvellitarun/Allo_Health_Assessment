import { NextResponse } from "next/server";
import { releaseReservation } from "@/services/reservation.service";

export const POST = async (
  _request: Request,
  { params }: { params: { id: string } }
) => {
  const idempotencyKey = _request.headers.get("Idempotency-Key");
  const result = await releaseReservation(params.id, idempotencyKey);
  return NextResponse.json(result.body, { status: result.status });
};
