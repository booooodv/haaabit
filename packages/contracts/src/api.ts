import { z } from "zod";

const nonEmptyString = z.string().trim().min(1);

export const apiAccessTokenResponseSchema = z.object({
  token: z.string().nullable(),
  docsPath: nonEmptyString,
  specPath: nonEmptyString,
});

export type ApiAccessTokenResponse = z.infer<typeof apiAccessTokenResponseSchema>;
