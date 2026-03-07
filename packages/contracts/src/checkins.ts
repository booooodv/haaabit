import { z } from "zod";

const nonEmptyString = z.string().trim().min(1);
const optionalNonEmptyString = z.string().trim().min(1).nullable().optional();

export const checkinSourceSchema = z.enum(["web", "ai", "system"]);

export const completeHabitInputSchema = z.object({
  habitId: nonEmptyString,
  source: checkinSourceSchema.default("web"),
  note: optionalNonEmptyString,
});

export const setHabitTotalInputSchema = z.object({
  habitId: nonEmptyString,
  total: z.number().int().nonnegative(),
  source: checkinSourceSchema.default("web"),
  note: optionalNonEmptyString,
});

export const undoHabitInputSchema = z.object({
  habitId: nonEmptyString,
  source: checkinSourceSchema.default("web"),
  note: optionalNonEmptyString,
});

export type CheckinSource = z.infer<typeof checkinSourceSchema>;
export type CompleteHabitInput = z.infer<typeof completeHabitInputSchema>;
export type SetHabitTotalInput = z.infer<typeof setHabitTotalInputSchema>;
export type UndoHabitInput = z.infer<typeof undoHabitInputSchema>;
