# Quick Task 8: 修复亚洲上海时区用户第二天习惯不重置的问题

**Date:** 2026-03-13
**Status:** In Progress

## Goal

修复用户时区默认值与注册写入链路不一致导致的日期计算偏差，统一 `today`、`check-in`、`stats`、`habit detail`、`habit create` 的日期基准，并为历史 `UTC` 用户提供迁移修复。

## Tasks

### Task 1
- files: [prisma/schema.prisma](/Users/finn/code/haaabit/prisma/schema.prisma), [prisma/migrations/20260313043000_shanghai_timezone_default/migration.sql](/Users/finn/code/haaabit/prisma/migrations/20260313043000_shanghai_timezone_default/migration.sql), [apps/api/src/shared/timezone.ts](/Users/finn/code/haaabit/apps/api/src/shared/timezone.ts), [apps/api/src/server.ts](/Users/finn/code/haaabit/apps/api/src/server.ts)
- action: 把默认时区改为 `Asia/Shanghai`，在注册成功后按浏览器传入或默认值写回 `user.timezone`，并为历史 `timezone='UTC'` 用户提供数据库迁移修复。
- verify: 新注册用户能持久化正确时区；迁移后旧用户不再保留 `UTC` 默认值。
- done: 用户表默认值、注册链路和存量修复方案一致。

### Task 2
- files: [apps/api/src/modules/today/today-clock.ts](/Users/finn/code/haaabit/apps/api/src/modules/today/today-clock.ts), [apps/api/src/modules/today/today.controller.ts](/Users/finn/code/haaabit/apps/api/src/modules/today/today.controller.ts), [apps/api/src/modules/checkins/checkin.service.ts](/Users/finn/code/haaabit/apps/api/src/modules/checkins/checkin.service.ts), [apps/api/src/modules/habits/habit.controller.ts](/Users/finn/code/haaabit/apps/api/src/modules/habits/habit.controller.ts), [apps/api/src/modules/habits/habit.service.ts](/Users/finn/code/haaabit/apps/api/src/modules/habits/habit.service.ts), [apps/api/src/modules/stats/stats.service.ts](/Users/finn/code/haaabit/apps/api/src/modules/stats/stats.service.ts)
- action: 统一按规范化后的 `user.timezone` 计算 `todayKey`，并把 `createHabit` 默认 `startDate` 改成基于用户时区的有效当天日期，而不是 UTC `toISOString().slice(0, 10)`。
- verify: 上海时区跨本地日界线后 `today` 日期切换正确；habit 默认起始日期跟随用户时区。
- done: 所有核心日期入口使用同一时区基准。

### Task 3
- files: [apps/web/lib/auth-client.ts](/Users/finn/code/haaabit/apps/web/lib/auth-client.ts), [apps/web/tests/accessibility/helpers.ts](/Users/finn/code/haaabit/apps/web/tests/accessibility/helpers.ts), [apps/api/test/helpers/app.ts](/Users/finn/code/haaabit/apps/api/test/helpers/app.ts), [apps/api/test/auth/auth-flow.test.ts](/Users/finn/code/haaabit/apps/api/test/auth/auth-flow.test.ts), [apps/api/test/today/today-clock.test.ts](/Users/finn/code/haaabit/apps/api/test/today/today-clock.test.ts), [apps/api/test/today/today-routes.test.ts](/Users/finn/code/haaabit/apps/api/test/today/today-routes.test.ts), [apps/api/test/habits/habit-persistence.test.ts](/Users/finn/code/haaabit/apps/api/test/habits/habit-persistence.test.ts)
- action: 前端注册请求优先透传浏览器时区，并补 API 自动化测试覆盖注册时区保存、UTC/上海 todayKey 差异、上海跨天切换和 habit 默认起始日期。
- verify: `vitest` 相关测试全部通过，覆盖用户要求的时区场景。
- done: 修复具备可回归的自动化保障。
