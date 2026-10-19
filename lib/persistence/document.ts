import { z } from "zod";

import { monumentDimensionsSchema } from "@/lib/validation/dimensions";
import { inscriptionElementsSchema } from "@/lib/validation/inscriptions";
import {
  monumentProfileSchema,
  validateProfile,
} from "@/lib/validation/profile";
import type { MonumentDimensionsInches } from "@/types/design";
import type { InscriptionElement, InscriptionId } from "@/types/inscription";
import type { MonumentProfile } from "@/types/profile";

export const DESIGN_FILE_FORMAT = "monumentstudio-design" as const;
export const DESIGN_DOCUMENT_VERSION = 1 as const;
export const MAX_DESIGN_FILE_BYTES = 65_536;

/**
 * Durable canonical model, not the earlier dimension-only demo model.
 * V1 positions use tablet-local inches: x is the center anchor, y the baseline.
 * The fixed preview material and serif text face are presentation conventions,
 * not configurable design choices. Derived geometry and text bounds are absent.
 */
const canonicalFieldsSchema = z
  .object({
    format: z.literal(DESIGN_FILE_FORMAT),
    schemaVersion: z.literal(DESIGN_DOCUMENT_VERSION),
    units: z.literal("in"),
    profile: monumentProfileSchema,
    dimensions: monumentDimensionsSchema,
    inscriptions: inscriptionElementsSchema.length(
      3,
      "A design must contain its name, dates, and epitaph elements.",
    ),
  })
  .strict()
  .superRefine((document, context) => {
    const result = validateProfile(
      document.profile,
      document.dimensions.tablet.height,
    );
    if (!result.success) {
      for (const issue of result.error.issues) {
        context.addIssue({
          code: "custom",
          path: ["profile", ...issue.path],
          message: issue.message,
        });
      }
    }
  });

/**
 * Strict Zod objects intentionally ignore __proto__ in some paths. Reject it
 * explicitly rather than accepting and silently discarding an unexpected key.
 * Iteration avoids recursion on hostile nesting. Accessors, cycles, symbols,
 * and non-JSON object prototypes are not document data either.
 */
function containsUnsafeStructure(input: unknown): boolean {
  const pending: unknown[] = [input];
  const seen = new WeakSet<object>();
  while (pending.length > 0) {
    const value = pending.pop();
    if (typeof value !== "object" || value === null) continue;
    if (seen.has(value)) return true;
    seen.add(value);
    const prototype = Object.getPrototypeOf(value);
    if (
      Array.isArray(value)
        ? prototype !== Array.prototype
        : prototype !== Object.prototype && prototype !== null
    )
      return true;
    for (const key of Reflect.ownKeys(value)) {
      if (Array.isArray(value) && key === "length") continue;
      if (
        typeof key !== "string" ||
        key === "__proto__" ||
        key === "constructor" ||
        key === "prototype"
      )
        return true;
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor?.enumerable || !("value" in descriptor)) return true;
      pending.push(descriptor.value);
    }
  }
  return false;
}

export const designDocumentSchema = z.preprocess((input, context) => {
  if (containsUnsafeStructure(input)) {
    context.addIssue({
      code: "custom",
      message: "Unexpected document structure.",
    });
    return z.NEVER;
  }
  return input;
}, canonicalFieldsSchema);

export type DesignDocument = z.infer<typeof designDocumentSchema>;
export type DesignFileError =
  | "corrupt"
  | "unsupported"
  | "invalid"
  | "too-large";
export type DesignFileResult =
  | { success: true; document: DesignDocument }
  | { success: false; code: DesignFileError };

const INSCRIPTION_ORDER: readonly InscriptionId[] = [
  "name",
  "dates",
  "epitaph",
];

/** Explicit property construction avoids merging arbitrary imported objects. */
function canonicalDocument(document: DesignDocument): DesignDocument {
  const { tablet, base } = document.dimensions;
  return {
    format: DESIGN_FILE_FORMAT,
    schemaVersion: DESIGN_DOCUMENT_VERSION,
    units: "in",
    profile:
      document.profile.kind === "upright-straight"
        ? { kind: "upright-straight" }
        : { kind: "upright-oval", capRiseIn: document.profile.capRiseIn },
    dimensions: {
      tablet: {
        width: tablet.width,
        height: tablet.height,
        thickness: tablet.thickness,
      },
      base: { width: base.width, height: base.height, depth: base.depth },
    },
    inscriptions: INSCRIPTION_ORDER.map((id) => {
      // The strict schema requires exactly three unique supported IDs.
      const element = document.inscriptions.find((item) => item.id === id)!;
      return {
        id,
        content: element.content,
        xIn: element.xIn,
        yIn: element.yIn,
        fontSizeIn: element.fontSizeIn,
      };
    }),
  };
}

/** Picks only canonical choices from a valid working design. */
export function createDesignDocument(input: {
  profile: MonumentProfile;
  dimensions: MonumentDimensionsInches;
  inscriptions: InscriptionElement[];
}): DesignDocument {
  return canonicalDocument(
    designDocumentSchema.parse({
      format: DESIGN_FILE_FORMAT,
      schemaVersion: DESIGN_DOCUMENT_VERSION,
      units: "in",
      profile: input.profile,
      dimensions: input.dimensions,
      inscriptions: input.inscriptions,
    }),
  );
}

/** Bounded, strict, non-throwing boundary for untrusted file/storage content. */
export function parseDesignFile(text: string): DesignFileResult {
  if (
    text.length > MAX_DESIGN_FILE_BYTES ||
    new TextEncoder().encode(text).byteLength > MAX_DESIGN_FILE_BYTES
  ) {
    return { success: false, code: "too-large" };
  }
  let input: unknown;
  try {
    input = JSON.parse(text);
  } catch {
    return { success: false, code: "corrupt" };
  }
  if (
    typeof input === "object" &&
    input !== null &&
    !Array.isArray(input) &&
    "format" in input &&
    input.format === DESIGN_FILE_FORMAT &&
    "schemaVersion" in input &&
    typeof input.schemaVersion === "number" &&
    Number.isInteger(input.schemaVersion) &&
    input.schemaVersion !== DESIGN_DOCUMENT_VERSION
  ) {
    return { success: false, code: "unsupported" };
  }
  const result = designDocumentSchema.safeParse(input);
  return result.success
    ? { success: true, document: canonicalDocument(result.data) }
    : { success: false, code: "invalid" };
}

/** Stable field/element ordering also provides an exact canonical dirty check. */
export function serializeDesignDocument(input: unknown): string {
  return `${JSON.stringify(
    canonicalDocument(designDocumentSchema.parse(input)),
    null,
    2,
  )}\n`;
}
