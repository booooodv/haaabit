import type { FastifyInstance } from "fastify";

import {
  completeTodayHabitHandler,
  getTodayHandler,
  setTodayHabitTotalHandler,
  undoTodayHabitHandler,
} from "./today.controller";

export async function registerTodayRoutes(app: FastifyInstance) {
  app.get("/api/today", getTodayHandler);
  app.post("/api/today/complete", completeTodayHabitHandler);
  app.post("/api/today/set-total", setTodayHabitTotalHandler);
  app.post("/api/today/undo", undoTodayHabitHandler);
}
