import { NextResponse } from "next/server";
import { getReservationById } from "@/services/reservation.service";

export const GET = async (
  _request: Request,
  { params }: { params: { id: string } }
) => {
  const reservation = await getReservationById(params.id);
  if (!reservation) {
    return NextResponse.json(
      { message: "Reservation not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: reservation });
};
