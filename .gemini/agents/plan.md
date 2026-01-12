# Cleanup & Monitoring Migration Plan

## 1. Documentation Update
- [x] Update `@.gemini/agents/plan.md` to reflect the pivot from custom tracking to Google Cloud Console + Rate Limiting.

## 2. Frontend Cleanup (Web)
- [x] **Remove Tracking Logic:**
    - Edit `apps/web/src/components/shared/ui/AddressForm.tsx` to remove `track-usage` calls and the session start listener.
- [x] **Dependencies:**
    - Keep `@mui/x-charts` as we will reuse it to display the fetched Google metrics.

## 3. Backend Cleanup (API)
- [x] **Remove Custom Tracking:**
    - Delete `apps/api/src/utils/usageTracker.ts`.
    - Delete `apps/api/src/services/emailService.ts`.
- [x] **Clean Controllers:**
    - Edit `apps/api/src/controllers/mapsController.ts`: Remove `incrementApiUsage` calls, `trackUsage` function, and `geocodeAddress` if it was only for tracking (or keep geocode as a proxy without tracking).
    - Edit `apps/api/src/controllers/adminController.ts`: Remove `getApiUsage`.
- [x] **Clean Routes:**
    - Edit `apps/api/src/routes/mapsRoutes.ts`: Remove `POST /track-usage`.
    - Edit `apps/api/src/routes/adminRoutes.ts`: Remove `GET /usage`.
- [x] **Remove Dependencies:**
    - Uninstall `nodemailer` from `apps/api`.

## 4. Database Cleanup
- [x] **Schema Update:**
    - Edit `packages/database/prisma/schema.prisma` to remove `model ApiUsage`.
- [x] **Migration:**
    - Run `npx prisma migrate dev --name remove_api_usage_tracking`.

## 5. Implement Google Monitoring Service
- [x] **Dependencies:**
    - Install `@google-cloud/monitoring` in `apps/api`.
- [x] **Service:**
    - Create `apps/api/src/services/googleMonitoringService.ts` to fetch metrics.
- [x] **Controller Update:**
    - Update `apps/api/src/controllers/adminController.ts` to add `getGoogleApiStats` which calls the monitoring service.
- [x] **Route Update:**
    - Add `GET /admin/google-stats` to `apps/api/src/routes/adminRoutes.ts`.

## 6. Frontend Integration
- [x] **Update Dashboard:**
    - Update `apps/web/src/app/admin-dashboard/usage/page.tsx` to fetch data from `/api/admin/google-stats` and display it using the existing charts.

## 7. Security Check (Rate Limiting)
- [x] **Verify Rate Limiting:**
    - Ensure `rateLimit` middleware is still active on `apps/api/src/routes/mapsRoutes.ts`.
