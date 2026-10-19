import { z } from "zod";

import type {
  DimensionDraft,
  DimensionFieldPath,
  MonumentDimensionsInches,
} from "@/types/design";

interface DimensionLimit {
  min: number;
  max: number;
}

export const DIMENSION_LIMITS = {
  "tablet.width": { min: 12, max: 120 },
  "tablet.height": { min: 12, max: 96 },
  "tablet.thickness": { min: 2, max: 24 },
  "base.width": { min: 12, max: 144 },
  "base.height": { min: 2, max: 24 },
  "base.depth": { min: 4, max: 48 },
} as const satisfies Record<DimensionFieldPath, DimensionLimit>;

function finiteDimension(path: DimensionFieldPath) {
  const { min, max } = DIMENSION_LIMITS[path];

  return z
    .number({ error: "Enter a numeric dimension." })
    .finite("Dimension must be a finite number.")
    .min(min, `Must be at least ${min} in.`)
    .max(max, `Must be no more than ${max} in.`);
}

export const monumentDimensionsSchema = z
  .object({
    tablet: z
      .object({
        width: finiteDimension("tablet.width"),
        height: finiteDimension("tablet.height"),
        thickness: finiteDimension("tablet.thickness"),
      })
      .strict(),
    base: z
      .object({
        width: finiteDimension("base.width"),
        height: finiteDimension("base.height"),
        depth: finiteDimension("base.depth"),
      })
      .strict(),
  })
  .strict()
  .superRefine((dimensions, context) => {
    if (dimensions.base.width < dimensions.tablet.width) {
      context.addIssue({
        code: "custom",
        path: ["base", "width"],
        message: "Base width must be at least the tablet width.",
      });
    }

    if (dimensions.base.depth < dimensions.tablet.thickness) {
      context.addIssue({
        code: "custom",
        path: ["base", "depth"],
        message: "Base depth must be at least the tablet thickness.",
      });
    }
  });

export type DimensionValidationResult = ReturnType<
  typeof monumentDimensionsSchema.safeParse
>;

function parseDraftNumber(value: string): number | undefined {
  if (value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export function validateDimensionDraft(
  draft: DimensionDraft,
): DimensionValidationResult {
  return monumentDimensionsSchema.safeParse({
    tablet: {
      width: parseDraftNumber(draft["tablet.width"]),
      height: parseDraftNumber(draft["tablet.height"]),
      thickness: parseDraftNumber(draft["tablet.thickness"]),
    },
    base: {
      width: parseDraftNumber(draft["base.width"]),
      height: parseDraftNumber(draft["base.height"]),
      depth: parseDraftNumber(draft["base.depth"]),
    },
  });
}

export function getDimensionErrors(
  result: DimensionValidationResult,
): Partial<Record<DimensionFieldPath, string>> {
  if (result.success) {
    return {};
  }

  const errors: Partial<Record<DimensionFieldPath, string>> = {};

  for (const issue of result.error.issues) {
    const path = issue.path.join(".") as DimensionFieldPath;
    if (path in DIMENSION_LIMITS && errors[path] === undefined) {
      errors[path] = issue.message;
    }
  }

  return errors;
}

export function assertValidDimensions(
  input: unknown,
): MonumentDimensionsInches {
  return monumentDimensionsSchema.parse(input);
}
