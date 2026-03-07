import type { FastifyInstance } from "fastify";

import { getOverviewStatsHandler } from "./stats.controller";

export async function registerStatsRoutes(app: FastifyInstance) {
  app.get("/api/stats/overview", getOverviewStatsHandler);
}
