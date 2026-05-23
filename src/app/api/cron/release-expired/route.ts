import { NextResponse } from "next/server";
import { releaseExpiredReservations } from "@/services/reservation.service";

export const POST = async () => {
  const result = await releaseExpiredReservations();
  return NextResponse.json(result);
};
