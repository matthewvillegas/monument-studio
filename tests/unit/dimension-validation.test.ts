import { describe, expect, it } from "vitest";

import { DEMO_DESIGN, createDimensionDraft } from "@/data/mock-designer";
import {
  DIMENSION_LIMITS,
  monumentDimensionsSchema,
  validateDimensionDraft,
} from "@/lib/validation/dimensions";
import type {
  DimensionFieldPath,
  MonumentDimensionsInches,
} from "@/types/design";

function withField(
  path: DimensionFieldPath,
  value: number,
): MonumentDimensionsInches {
  const copy = structuredClone(DEMO_DESIGN.dimensions);

  switch (path) {
    case "tablet.width":
      copy.tablet.width = value;
      break;
    case "tablet.height":
      copy.tablet.height = value;
      break;
    case "tablet.thickness":
      copy.tablet.thickness = value;
      break;
    case "base.width":
      copy.base.width = value;
      break;
    case "base.height":
      copy.base.height = value;
      break;
    case "base.depth":
      copy.base.depth = value;
      break;
  }

  return copy;
}

function expectIssueAt(input: unknown, path: DimensionFieldPath): void {
  const result = monumentDimensionsSchema.safeParse(input);
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues.some((issue) => issue.path.join(".") === path)).toBe(
      true,
    );
  }
}

describe("monument dimension validation", () => {
  it("accepts the demonstration dimensions", () => {
    expect(monumentDimensionsSchema.safeParse(DEMO_DESIGN.dimensions).success).toBe(
      true,
    );
  });

  it("accepts decimal dimensions and valid equality boundaries", () => {
    const dimensions: MonumentDimensionsInches = {
      tablet: { width: 40.5, height: 28.25, thickness: 7.5 },
      base: { width: 40.5, height: 7.25, depth: 7.5 },
    };

    expect(monumentDimensionsSchema.safeParse(dimensions).success).toBe(true);
  });

  it.each(Object.keys(DIMENSION_LIMITS) as DimensionFieldPath[])(
    "accepts the exact documented limits for %s",
    (path) => {
      const { min, max } = DIMENSION_LIMITS[path];
      const atMinimum = withField(path, min);
      const atMaximum = withField(path, max);

      if (path === "base.width") {
        atMinimum.tablet.width = min;
      }
      if (path === "base.depth") {
        atMinimum.tablet.thickness = Math.min(
          atMinimum.tablet.thickness,
          min,
        );
      }
      if (path === "tablet.width") {
        atMaximum.base.width = max;
      }
      if (path === "tablet.thickness") {
        atMaximum.base.depth = max;
      }

      expect(monumentDimensionsSchema.safeParse(atMinimum).success).toBe(true);
      expect(monumentDimensionsSchema.safeParse(atMaximum).success).toBe(true);
    },
  );

  it.each(Object.keys(DIMENSION_LIMITS) as DimensionFieldPath[])(
    "rejects values outside the documented limits for %s",
    (path) => {
      const { min, max } = DIMENSION_LIMITS[path];
      expectIssueAt(withField(path, min - 0.01), path);
      expectIssueAt(withField(path, max + 0.01), path);
    },
  );

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid numeric input %s",
    (value) => {
      expectIssueAt(withField("tablet.height", value), "tablet.height");
    },
  );

  it("rejects a base narrower than the tablet", () => {
    const dimensions = structuredClone(DEMO_DESIGN.dimensions);
    dimensions.base.width = dimensions.tablet.width - 1;

    expectIssueAt(dimensions, "base.width");
  });

  it("rejects a base shallower than the tablet", () => {
    const dimensions = structuredClone(DEMO_DESIGN.dimensions);
    dimensions.base.depth = dimensions.tablet.thickness - 1;

    expectIssueAt(dimensions, "base.depth");
  });

  it("does not silently coerce numeric strings", () => {
    expectIssueAt(
      {
        ...DEMO_DESIGN.dimensions,
        tablet: { ...DEMO_DESIGN.dimensions.tablet, width: "48" },
      },
      "tablet.width",
    );
  });

  it("rejects unknown persisted properties", () => {
    const result = monumentDimensionsSchema.safeParse({
      ...DEMO_DESIGN.dimensions,
      unrecognized: true,
    });

    expect(result.success).toBe(false);
  });

  it("treats a blank draft field as missing instead of zero", () => {
    const draft = createDimensionDraft();
    draft["tablet.width"] = "";

    const result = validateDimensionDraft(draft);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some(
          (issue) => issue.path.join(".") === "tablet.width",
        ),
      ).toBe(true);
    }
  });
});
