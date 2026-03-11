import type { HaaabitApiClient } from "../client/api-client.js";

import { createHabitsReadOperations, createHabitsWriteOperations } from "./habits.js";
import type { ToolOperation } from "./operation-types.js";
import { createStatsReadOperations } from "./stats.js";
import { createTodayReadOperations, createTodayWriteOperations } from "./today.js";

export function createToolOperations(options: { client: HaaabitApiClient }): Record<string, ToolOperation> {
  return {
    ...createHabitsReadOperations(options.client),
    ...createHabitsWriteOperations(options.client),
    ...createTodayReadOperations(options.client),
    ...createTodayWriteOperations(options.client),
    ...createStatsReadOperations(options.client),
  };
}
