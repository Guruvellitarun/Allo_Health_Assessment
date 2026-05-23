"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/toast";
import type { ReservationDetail } from "@/types/reservation";

type ReservationSummaryProps = {
  reservation: ReservationDetail;
};

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const ReservationSummary = ({ reservation }: ReservationSummaryProps) => {
  const router = useRouter();
  const { pushToast } = useToast();
  const [status, setStatus] = React.useState(reservation.status);
  const [remainingSeconds, setRemainingSeconds] = React.useState(() => {
    const expiresAt = new Date(reservation.expiresAt).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((expiresAt - now) / 1000));
  });
  const [isWorking, setIsWorking] = React.useState(false);

  React.useEffect(() => {
    if (status !== "pending") {
      setRemainingSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setStatus("released");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  const sendAction = async (
    path: string,
    successMessage: string,
    nextStatus: "confirmed" | "released"
  ) => {
    setIsWorking(true);
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: {
          "Idempotency-Key": crypto.randomUUID(),
        },
      });

      if (response.status === 200) {
        const data = await response.json();
        const updatedStatus = data.status ?? nextStatus;
        setStatus(updatedStatus);
        pushToast({ title: successMessage, variant: "success" });
        router.refresh();
        if (updatedStatus === "confirmed") {
          router.push("/reservations");
        }
        return;
      }

      if (response.status === 410) {
        pushToast({
          title: "Reservation expired",
          description: "This hold has already expired.",
          variant: "error",
        });
        setStatus("released");
        return;
      }

      const error = await response.json();
      if (response.status === 409 && error.code === "NOT_PENDING") {
        const current = await fetch(`/api/reservations/${reservation.id}`);
        if (current.ok) {
          const json = await current.json();
          const nextStatus = json.data?.status;
          if (nextStatus) {
            setStatus(nextStatus);
            const title =
              nextStatus === "confirmed"
                ? "Reservation already confirmed"
                : nextStatus === "released"
                  ? "Reservation already released"
                  : "Reservation updated";
            pushToast({ title, variant: "success" });
            router.refresh();
            return;
          }
        }
      }

      pushToast({
        title: error.message ?? "Action failed",
        description: error.code,
        variant: "error",
      });
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Reservation Checkout</h1>
        <p className="text-sm text-[var(--muted)]">
          Review the hold before confirming payment.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{reservation.product.name}</CardTitle>
          <p className="text-xs text-[var(--muted)]">
            SKU {reservation.product.sku} at {reservation.warehouse.name} ({
              reservation.warehouse.code
            })
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-[var(--muted)]">Quantity</p>
              <p className="font-mono text-lg">{reservation.quantity}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted)]">Expires In</p>
              <p className="font-mono text-lg">
                {status === "pending" ? formatDuration(remainingSeconds) : "0:00"}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted)]">Price</p>
              <p className="font-mono text-lg">
                ₹{reservation.priceInr.toLocaleString("en-IN")}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted)]">Status</p>
              <p className="text-sm font-semibold capitalize">{status}</p>
            </div>
          </div>

          {status !== "pending" ? (
            <Alert>
              <AlertTitle>Hold closed</AlertTitle>
              <AlertDescription>
                This reservation is no longer active. Return to the catalog to
                create a new hold.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="flex gap-3">
            <Button
              onClick={() =>
                sendAction(
                  `/api/reservations/${reservation.id}/confirm`,
                  "Reservation confirmed",
                  "confirmed"
                )
              }
              disabled={status !== "pending" || isWorking}
            >
              Confirm Reservation
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                sendAction(
                  `/api/reservations/${reservation.id}/release`,
                  "Reservation released",
                  "released"
                )
              }
              disabled={status !== "pending" || isWorking}
            >
              Release Hold
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
