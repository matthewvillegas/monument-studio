import { z } from "zod";

import type { MonumentProfile } from "@/types/profile";

export const monumentProfileSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("upright-straight") }).strict(),
  z
    .object({
      kind: z.literal("upright-oval"),
      capRiseIn: z
        .number({ error: "Enter a numeric cap rise." })
        .finite("Cap rise must be finite.")
        .positive("Cap rise must be greater than zero."),
    })
    .strict(),
]);

function profileForHeight(tabletHeightIn: number) {
  return monumentProfileSchema.superRefine((profile, context) => {
    if (!Number.isFinite(tabletHeightIn) || tabletHeightIn <= 0) {
      context.addIssue({
        code: "custom",
        message: "Tablet height must be a positive finite number.",
      });
    } else if (
      profile.kind === "upright-oval" &&
      profile.capRiseIn > tabletHeightIn
    ) {
      context.addIssue({
        code: "custom",
        path: ["capRiseIn"],
        message: "Cap rise cannot exceed the tablet height.",
      });
    }
  });
}

export function validateProfile(input: unknown, tabletHeightIn: number) {
  return profileForHeight(tabletHeightIn).safeParse(input);
}

export function assertValidProfile(
  input: unknown,
  tabletHeightIn: number,
): MonumentProfile {
  return profileForHeight(tabletHeightIn).parse(input);
}
