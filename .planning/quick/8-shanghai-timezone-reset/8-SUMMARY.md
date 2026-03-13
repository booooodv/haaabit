# Quick Task 8 Summary

**Description:** 修复亚洲上海时区用户第二天习惯不重置的问题
**Date:** 2026-03-13
**Code Commit:** `fc85a4c`

## What Changed

- Added a shared timezone normalizer with `Asia/Shanghai` as the application fallback, and changed the Prisma `User.timezone` default plus a SQLite migration that rewrites legacy `timezone='UTC'` rows.
- Updated the sign-up route to persist the requested browser timezone after account creation, while defaulting missing or invalid values to `Asia/Shanghai`.
- Made `resolveHabitDay` normalize incoming timezone values before computing `todayKey`, so `today`, `check-ins`, `stats`, and habit detail all stay on the same business-day axis.
- Changed habit creation to derive the default `startDate` from the authenticated user's timezone-aware effective day instead of raw UTC `toISOString().slice(0, 10)`.
- Updated the web auth client and browser-based test helper to include `Intl.DateTimeFormat().resolvedOptions().timeZone` on sign-up requests when available.
- Added regression coverage for timezone persistence at sign-up, UTC-vs-Shanghai day resolution, Shanghai cutoff rollover in `/api/today`, and timezone-aware default habit start dates.

## Verification

- `pnpm --filter @haaabit/api exec vitest run test/auth/auth-flow.test.ts test/today/today-clock.test.ts test/today/today-routes.test.ts test/habits/habit-persistence.test.ts`
- `pnpm --filter @haaabit/api exec vitest run test/auth test/today test/checkins test/stats test/habits/habit-detail-routes.test.ts test/habits/habit-management.test.ts`
- `pnpm typecheck`

## Outcome

Shanghai users now roll to the correct local habit day instead of staying pinned to UTC defaults, new accounts persist the right timezone automatically, legacy default-UTC users have a migration path, and habit creation no longer seeds `startDate` from the wrong date basis.
