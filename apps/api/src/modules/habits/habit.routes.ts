import type { FastifyInstance } from "fastify";

import { createHabitHandler, listHabitsHandler } from "./habit.controller";

export async function registerHabitRoutes(app: FastifyInstance) {
  app.get("/api/habits", listHabitsHandler);
  app.post("/api/habits", createHabitHandler);
}
