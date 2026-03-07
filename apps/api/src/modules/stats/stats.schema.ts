import { overviewStatsSchema } from "@haaabit/contracts/stats";

export function parseOverviewStats(input: unknown) {
  return overviewStatsSchema.parse(input);
}
