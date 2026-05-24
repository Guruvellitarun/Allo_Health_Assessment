import { Prisma } from "@prisma/client";
import type { Reservation } from "@prisma/client";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { addMinutes, nowUtc, RESERVATION_TTL_MINUTES } from "@/lib/time";
import { ServiceError } from "@/types/errors";
import type { ReservationCreateInput } from "@/types/reservation";

type IdempotencyResult<T> = {
  status: number;
  body: T;
};

type ReservationResultBody = Reservation | { message: string; code: string } | null;

const IDEMPOTENCY_TTL_SECONDS = 60 * 60 * 24;

const getIdempotencyKey = (scope: string, key: string): string =>
  `idemp:${scope}:${key}`;

const getCached = async <T>(
  scope: string,
  key?: string | null
): Promise<IdempotencyResult<T> | null> => {
  if (!redis) return null;
  if (!key) return null;
  const cached = await redis.get<IdempotencyResult<T>>(getIdempotencyKey(scope, key));
  return cached ?? null;
};

const setCached = async <T>(
  scope: string,
  key: string | null | undefined,
  value: IdempotencyResult<T>
): Promise<void> => {
  if (!redis) return;
  if (!key) return;
  await redis.set(getIdempotencyKey(scope, key), value, {
    ex: IDEMPOTENCY_TTL_SECONDS,
  });
};

export const reserveInventory = async (
  input: ReservationCreateInput,
  idempotencyKey?: string | null
) => {
  const cached = await getCached("reserve", idempotencyKey);
  if (cached) return cached;

  const expiresAt = addMinutes(nowUtc(), RESERVATION_TTL_MINUTES);

  try {
    const reservation = await prisma.$transaction(async (tx) => {
      const updated = await tx.$executeRaw`
        UPDATE "Inventory"
        SET "reservedUnits" = "reservedUnits" + ${input.quantity}
        WHERE "productId" = ${input.productId}
          AND "warehouseId" = ${input.warehouseId}
          AND ("totalUnits" - "reservedUnits") >= ${input.quantity}
      `;

      if (updated === 0) {
        throw new ServiceError("Out of stock", 409, "OUT_OF_STOCK");
      }

      return tx.reservation.create({
        data: {
          productId: input.productId,
          warehouseId: input.warehouseId,
          quantity: input.quantity,
          expiresAt,
          idempotencyKey: idempotencyKey ?? null,
        },
      });
    });

    const result = { status: 201, body: reservation };
    await setCached("reserve", idempotencyKey, result);
    return result;
  } catch (error) {
    if (error instanceof ServiceError) {
      const result = { status: error.status, body: { message: error.message, code: error.code } };
      await setCached("reserve", idempotencyKey, result);
      return result;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const result = {
        status: 409,
        body: { message: "Duplicate idempotency key", code: "IDEMPOTENCY_CONFLICT" },
      };
      await setCached("reserve", idempotencyKey, result);
      return result;
    }

    throw error;
  }
};

export const confirmReservation = async (
  reservationId: string,
  idempotencyKey?: string | null
) => {
  const cached = await getCached<ReservationResultBody>("confirm", idempotencyKey);
  if (cached) return cached;

  const now = nowUtc();
  const result: IdempotencyResult<ReservationResultBody> = await prisma.$transaction(async (tx) => {
    const current = await tx.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!current) {
      return { status: 404, body: { message: "Reservation not found", code: "NOT_FOUND" } };
    }

    if (current.status === "confirmed") {
      return { status: 200, body: current };
    }

    if (current.status === "pending" && current.expiresAt <= now) {
      return { status: 410, body: { message: "Reservation expired", code: "EXPIRED" } };
    }

    const updatedReservation = await tx.reservation.updateMany({
      where: {
        id: reservationId,
        status: "pending",
        expiresAt: { gt: now },
      },
      data: {
        status: "confirmed",
        updatedAt: now,
      },
    });

    if (updatedReservation.count === 0) {
      return { status: 409, body: { message: "Reservation not pending", code: "NOT_PENDING" } };
    }

    const updatedInventory = await tx.$executeRaw`
      UPDATE "Inventory"
      SET "totalUnits" = "totalUnits" - ${current.quantity},
          "reservedUnits" = "reservedUnits" - ${current.quantity}
      WHERE "productId" = ${current.productId}
        AND "warehouseId" = ${current.warehouseId}
        AND "totalUnits" >= ${current.quantity}
        AND "reservedUnits" >= ${current.quantity}
    `;

    if (updatedInventory === 0) {
      throw new ServiceError("Inventory mismatch", 409, "INVENTORY_MISMATCH");
    }

    const updated = await tx.reservation.findUnique({
      where: { id: reservationId },
    });

    return { status: 200, body: updated };
  });

  await setCached<ReservationResultBody>("confirm", idempotencyKey, result);
  return result;
};

export const releaseReservation = async (
  reservationId: string,
  idempotencyKey?: string | null
) => {
  const cached = await getCached<ReservationResultBody>("release", idempotencyKey);
  if (cached) return cached;

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
  });

  if (!reservation) {
    return { status: 404, body: { message: "Reservation not found", code: "NOT_FOUND" } };
  }

  if (reservation.status !== "pending") {
    return { status: 409, body: { message: "Reservation not pending", code: "NOT_PENDING" } };
  }

  const result: IdempotencyResult<ReservationResultBody> = await prisma.$transaction(async (tx) => {
    const updatedReservation = await tx.$executeRaw`
      UPDATE "Reservation"
      SET "status" = 'released', "updatedAt" = NOW()
      WHERE "id" = ${reservationId}
        AND "status" = 'pending'
    `;

    if (updatedReservation === 0) {
      return { status: 409, body: { message: "Reservation not pending", code: "NOT_PENDING" } };
    }

    const updatedInventory = await tx.$executeRaw`
      UPDATE "Inventory"
      SET "reservedUnits" = "reservedUnits" - ${reservation.quantity}
      WHERE "productId" = ${reservation.productId}
        AND "warehouseId" = ${reservation.warehouseId}
        AND "reservedUnits" >= ${reservation.quantity}
    `;

    if (updatedInventory === 0) {
      throw new ServiceError("Inventory mismatch", 409, "INVENTORY_MISMATCH");
    }

    const updated = await tx.reservation.findUnique({
      where: { id: reservationId },
    });

    return { status: 200, body: updated };
  });

  await setCached<ReservationResultBody>("release", idempotencyKey, result);
  return result;
};

export const getReservationById = async (reservationId: string) => {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      product: true,
      warehouse: true,
    },
  });

  if (!reservation) return null;

  const inventory = await prisma.inventory.findUnique({
    where: {
      productId_warehouseId: {
        productId: reservation.productId,
        warehouseId: reservation.warehouseId,
      },
    },
  });

  return { reservation, inventory };
};

export const listRecentReservations = async (limit = 20) =>
  prisma.reservation.findMany({
    include: { product: true, warehouse: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

export const releaseExpiredReservations = async () => {
  const now = nowUtc();
  const expired = await prisma.reservation.findMany({
    where: {
      status: "pending",
      expiresAt: { lt: now },
    },
  });

  let releasedCount = 0;

  for (const reservation of expired) {
    const released = await prisma.$transaction(async (tx) => {
      const updatedReservation = await tx.$executeRaw`
        UPDATE "Reservation"
        SET "status" = 'released', "updatedAt" = NOW()
        WHERE "id" = ${reservation.id}
          AND "status" = 'pending'
          AND "expiresAt" < NOW()
      `;

      if (updatedReservation === 0) return false;

      await tx.$executeRaw`
        UPDATE "Inventory"
        SET "reservedUnits" = "reservedUnits" - ${reservation.quantity}
        WHERE "productId" = ${reservation.productId}
          AND "warehouseId" = ${reservation.warehouseId}
          AND "reservedUnits" >= ${reservation.quantity}
      `;

      return true;
    });

    if (released) releasedCount += 1;
  }

  return { releasedCount };
};
