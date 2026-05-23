"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ReservedItemsList } from "@/components/features/reserved-items-list";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ReservationListItem } from "@/types/reservation";

export default function ReservationsPage() {
  const router = useRouter();
  const [items, setItems] = React.useState<ReservationListItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadReservations = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/reservations?limit=50");
      const json = await response.json();
      setItems(json.data ?? []);
    } catch (err) {
      setError("Unable to load reservations.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      loadReservations();
    }, 5000);
    return () => clearInterval(interval);
  }, [loadReservations]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            Reservation History
          </p>
          <h1 className="text-3xl font-semibold">Reserved items</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Track pending holds and completed reservations across warehouses.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/")}> 
          Back to products
        </Button>
      </div>

      {error ? (
        <Alert className="mb-6">
          <AlertTitle>Data unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <ReservedItemsList items={items} isLoading={isLoading} />
    </main>
  );
}
