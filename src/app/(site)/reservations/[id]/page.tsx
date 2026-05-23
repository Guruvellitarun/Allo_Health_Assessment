import { notFound } from "next/navigation";
import { getReservationById } from "@/services/reservation.service";
import { ReservationSummary } from "@/components/features/reservation-summary";
import type { ReservationDetail } from "@/types/reservation";

export default async function ReservationPage({
  params,
}: {
  params: { id: string };
}) {
  const reservation = await getReservationById(params.id);

  if (!reservation) {
    notFound();
  }

  const { reservation: detail, inventory } = reservation;

  const data: ReservationDetail = {
    id: detail.id,
    status: detail.status,
    quantity: detail.quantity,
    expiresAt: detail.expiresAt.toISOString(),
    priceInr: inventory?.priceInr ?? 0,
    product: {
      id: detail.product.id,
      sku: detail.product.sku,
      name: detail.product.name,
    },
    warehouse: {
      id: detail.warehouse.id,
      code: detail.warehouse.code,
      name: detail.warehouse.name,
    },
  };

  return <ReservationSummary reservation={data} />;
}
