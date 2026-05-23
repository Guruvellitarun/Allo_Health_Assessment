# Allo Inventory Reservation Platform

A Next.js App Router platform that prevents checkout race conditions by reserving inventory with atomic database updates and expiring holds.

## Highlights
- Atomic reservation updates with PostgreSQL row-level locking via Prisma $executeRaw
- Redis idempotency keys for reserve/confirm/release endpoints
- Auto-expiring reservations with a cron endpoint
- High-density product grid UI with live countdowns and error handling

## Tech Stack
- Next.js (App Router)
- TypeScript (strict)
- Prisma + PostgreSQL (Supabase/Neon)
- Zod validation
- Tailwind CSS
- Redis (Upstash)

## Concurrency Model
Inventory is reserved with a single atomic update to avoid read-then-write races:

```sql
UPDATE "Inventory"
SET "reservedUnits" = "reservedUnits" + $quantity
WHERE "productId" = $productId
  AND "warehouseId" = $warehouseId
  AND ("totalUnits" - "reservedUnits") >= $quantity
```

If the update affects 0 rows, the request returns 409 Conflict. This guarantees that only one request can reserve the last unit.

Confirm and release actions also use atomic updates that only transition a reservation when it is still pending (and not expired for confirm).

## Idempotency
Clients can pass an `Idempotency-Key` header to reserve/confirm/release endpoints. Results are cached in Redis for 24 hours to prevent duplicate side effects on retries.

If Redis is not configured in local development, idempotency caching is skipped and the endpoints still function.

## Reservation Expiry
Pending reservations include `expiresAt`. The `/api/cron/release-expired` endpoint transitions expired reservations to `released` and restores inventory. Schedule this endpoint using Vercel Cron (or any scheduler).

## Local Setup
1. Clone and install dependencies
   - `git clone <your-fork-url>`
   - `cd allo-inventory`
   - `npm install`
2. Create a database
   - Recommended: Supabase, Neon, or Railway (free tier is fine).
   - Copy the **direct** Postgres connection string.
3. Add environment variables
   - Create a `.env` file in the project root with:
     - `DATABASE_URL=postgres://...`
     - `UPSTASH_REDIS_REST_URL=...` (optional for idempotency)
     - `UPSTASH_REDIS_REST_TOKEN=...` (optional for idempotency)
4. Run migrations
   - `npx prisma migrate dev`
5. Seed demo data
   - `npm run prisma:seed`
6. Start the app
   - `npm run dev`
   - Open `http://localhost:3000`

If you want to reset everything and start fresh:
```
npx prisma migrate reset
npm run prisma:seed
```

## Product Images
Place images in:
```
public/images/products
```
Use these exact filenames:
- `SAMSUNG-S26-ULTRA.jpg`
- `IPHONE-17-PRO-MAX.jpg`
- `GOOGLE-PIXEL-10-PRO.jpg`
- `SAMSUNG-FOLD-7.jpg`

Recommended size: **800x600** or **1200x900** (4:3 ratio).

## Deployment Notes
- Use a hosted Postgres provider (Supabase/Neon/Railway) for production.
- Point `DATABASE_URL` to the hosted database, and re-run migrations + seed.
- Add Upstash Redis env vars to enable idempotency in production.
- Deploy to Vercel and set the same env vars in the Vercel project.

## API Endpoints
- `GET /api/products` - List products with stock per warehouse
- `GET /api/warehouses` - List warehouses
- `POST /api/reservations` - Reserve units (409 if out of stock)
- `POST /api/reservations/:id/confirm` - Confirm reservation (410 if expired)
- `POST /api/reservations/:id/release` - Release reservation early
- `POST /api/cron/release-expired` - Release expired pending reservations

## UI Flow
- Product listing page shows available stock (total minus reserved) per warehouse and allows reserving units.
- Reservation page shows a live countdown and allows confirm/release actions.
- 409 and 410 errors are surfaced via toasts and inline alerts.

## Notes
- Replace the placeholder image block in the product grid with real product images.
- Ensure the cron endpoint is protected or only callable by your scheduler in production.
