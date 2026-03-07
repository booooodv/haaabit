import type { FastifyInstance } from "fastify";

import {
  archiveHabitHandler,
  createHabitHandler,
  listHabitsHandler,
  restoreHabitHandler,
  updateHabitHandler,
} from "./habit.controller";

export async function registerHabitRoutes(app: FastifyInstance) {
  app.get("/api/habits", listHabitsHandler);
  app.post("/api/habits", createHabitHandler);
  app.patch("/api/habits/:habitId", updateHabitHandler);
  app.post("/api/habits/:habitId/archive", archiveHabitHandler);
  app.post("/api/habits/:habitId/restore", restoreHabitHandler);
}
