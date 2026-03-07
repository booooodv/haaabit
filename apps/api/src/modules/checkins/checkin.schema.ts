import {
  completeHabitInputSchema,
  setHabitTotalInputSchema,
  undoHabitInputSchema,
  type CheckinSource,
} from "@haaabit/contracts/checkins";

export function parseCompleteHabitInput(input: unknown) {
  return completeHabitInputSchema.parse(input);
}

export function parseSetHabitTotalInput(input: unknown) {
  return setHabitTotalInputSchema.parse(input);
}

export function parseUndoHabitInput(input: unknown) {
  return undoHabitInputSchema.parse(input);
}

export function normalizeOptionalNote(note: string | null | undefined) {
  return note ?? null;
}

export type CheckinSourceInput = CheckinSource;
