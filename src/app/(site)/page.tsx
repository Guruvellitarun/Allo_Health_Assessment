"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ProductGrid } from "@/components/features/product-grid";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { ProductListItem } from "@/types/product";

export default function ProductsPage() {
  const router = useRouter();
  const { pushToast } = useToast();
  const [products, setProducts] = React.useState<ProductListItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadProducts = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/products");
      const json = await response.json();
      setProducts(json.data ?? []);
    } catch (err) {
      setError("Unable to load products.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      loadProducts();
    }, 5000);
    return () => clearInterval(interval);
  }, [loadProducts]);

  const handleReserve = async (
    productId: string,
    warehouseId: string,
    quantity: number
  ) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({ productId, warehouseId, quantity }),
      });

      if (response.status === 201) {
        const reservation = await response.json();
        pushToast({
          title: "Inventory reserved",
          description: "Proceed to checkout before the hold expires.",
          variant: "success",
        });
        router.push(`/reservations/${reservation.id}`);
        return;
      }

      if (response.status === 409) {
        const message = await response.json();
        pushToast({
          title: "Out of stock",
          description: message.message ?? "The requested quantity is unavailable.",
          variant: "error",
        });
        await loadProducts();
        return;
      }

      const error = await response.json();
      pushToast({
        title: "Reservation failed",
        description: error.message ?? "Try again.",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            Inventory Dashboard
          </p>
          <h1 className="text-3xl font-semibold">Reserve inventory instantly</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Holds auto-expire to prevent overselling. All counts update in real time
            as reservations are made.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/reservations")}> 
          Reserved items
        </Button>
      </div>

      {error ? (
        <Alert className="mb-6">
          <AlertTitle>Data unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {isLoading && products.length === 0 ? (
        <div className="text-sm text-[var(--muted)]">Loading products...</div>
      ) : (
        <ProductGrid
          products={products}
          isLoading={isLoading}
          onReserve={handleReserve}
        />
      )}
    </main>
  );
}
