"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import type { ReservationListItem } from "@/types/reservation";

type ReservedItemsListProps = {
  items: ReservationListItem[];
  isLoading: boolean;
};

const statusStyles: Record<ReservationListItem["status"], string> = {
  pending: "text-[#1a7f5a] bg-[#e8f5ef] border-[#c7e6d8]",
  confirmed: "text-[#0b4a6f] bg-[#e6f2f8] border-[#c7deee]",
  released: "text-[var(--muted)] bg-[#f1f2f1] border-[#e0e3e0]",
};

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const splitReservations = (items: ReservationListItem[]) => {
  const now = Date.now();
  const active: ReservationListItem[] = [];
  const purchased: ReservationListItem[] = [];
  const expired: ReservationListItem[] = [];
  const released: ReservationListItem[] = [];

  for (const item of items) {
    const expiresAt = new Date(item.expiresAt).getTime();
    const isActive = item.status === "pending" && expiresAt > now;
    const isExpired = item.status === "pending" && expiresAt <= now;

    if (item.status === "confirmed") {
      purchased.push(item);
    } else if (item.status === "released") {
      released.push(item);
    } else if (isActive) {
      active.push(item);
    } else if (isExpired) {
      expired.push(item);
    }
  }

  return { active, purchased, expired, released };
};

const formatTimestamp = (value: string): string => {
  const date = new Date(value);
  return date.toLocaleString();
};

const ReservationTable = ({
  items,
  mode,
}: {
  items: ReservationListItem[];
  mode: "active" | "expired" | "released" | "purchased";
}) => (
  <Table>
    <TableHead>
      <TableRow>
        <TableHeaderCell>Product</TableHeaderCell>
        <TableHeaderCell>Warehouse</TableHeaderCell>
        <TableHeaderCell className="font-mono">Qty</TableHeaderCell>
        <TableHeaderCell>Status</TableHeaderCell>
        {mode === "active" ? (
          <TableHeaderCell className="font-mono">Remaining</TableHeaderCell>
        ) : mode === "purchased" ? (
          <TableHeaderCell>Purchased At</TableHeaderCell>
        ) : mode === "released" ? (
          <TableHeaderCell>Released At</TableHeaderCell>
        ) : (
          <TableHeaderCell>Expired At</TableHeaderCell>
        )}
        <TableHeaderCell />
      </TableRow>
    </TableHead>
    <TableBody>
      {items.map((item) => {
        const expiresAt = new Date(item.expiresAt).getTime();
        const remainingSeconds = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
        const remainingLabel = remainingSeconds > 0 ? formatDuration(remainingSeconds) : "0:00";
        const closedAt =
          mode === "expired"
            ? item.expiresAt
            : item.updatedAt;

        return (
          <TableRow key={item.id}>
            <TableCell>
              <div className="text-sm font-medium">{item.product.name}</div>
              <div className="text-xs text-[var(--muted)]">{item.product.sku}</div>
            </TableCell>
            <TableCell>
              <div className="text-sm font-medium">{item.warehouse.name}</div>
              <div className="text-xs text-[var(--muted)]">{item.warehouse.code}</div>
            </TableCell>
            <TableCell className="font-mono">{item.quantity}</TableCell>
            <TableCell>
              <span
                className={`text-xs font-semibold capitalize rounded-full border px-2 py-0.5 ${
                  statusStyles[item.status]
                }`}
              >
                {item.status}
              </span>
            </TableCell>
            {mode === "active" ? (
              <TableCell className="font-mono">{remainingLabel}</TableCell>
            ) : (
              <TableCell className="text-xs text-[var(--muted)]">
                {formatTimestamp(closedAt)}
              </TableCell>
            )}
            <TableCell>
              <Link
                href={`/reservations/${item.id}`}
                className="text-xs font-medium text-[var(--accent)]"
              >
                View
              </Link>
            </TableCell>
          </TableRow>
        );
      })}
    </TableBody>
  </Table>
);

export const ReservedItemsList = ({ items, isLoading }: ReservedItemsListProps) => {
  const [, forceUpdate] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate((value) => value + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const { active, purchased, expired, released } = splitReservations(items);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Active Reservations</CardTitle>
          <p className="text-xs text-[var(--muted)]">
            Holds that are still valid and counting down.
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-[var(--muted)]">Loading activity...</div>
          ) : null}
          {!isLoading && active.length === 0 ? (
            <div className="text-sm text-[var(--muted)]">
              No active reservations right now.
            </div>
          ) : null}
          {active.length > 0 ? <ReservationTable items={active} mode="active" /> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Purchased</CardTitle>
          <p className="text-xs text-[var(--muted)]">
            Confirmed reservations that completed checkout.
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-[var(--muted)]">Loading activity...</div>
          ) : null}
          {!isLoading && purchased.length === 0 ? (
            <div className="text-sm text-[var(--muted)]">
              No purchases yet.
            </div>
          ) : null}
          {purchased.length > 0 ? (
            <ReservationTable items={purchased} mode="purchased" />
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expired</CardTitle>
          <p className="text-xs text-[var(--muted)]">
            Holds that expired before checkout completed.
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-[var(--muted)]">Loading activity...</div>
          ) : null}
          {!isLoading && expired.length === 0 ? (
            <div className="text-sm text-[var(--muted)]">
              No expired reservations yet.
            </div>
          ) : null}
          {expired.length > 0 ? <ReservationTable items={expired} mode="expired" /> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Released</CardTitle>
          <p className="text-xs text-[var(--muted)]">
            Holds released manually before purchase.
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-[var(--muted)]">Loading activity...</div>
          ) : null}
          {!isLoading && released.length === 0 ? (
            <div className="text-sm text-[var(--muted)]">
              No releases yet.
            </div>
          ) : null}
          {released.length > 0 ? <ReservationTable items={released} mode="released" /> : null}
        </CardContent>
      </Card>
    </div>
  );
};
