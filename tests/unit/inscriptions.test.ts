import { describe, expect, it } from "vitest";

import {
  checkInscriptionLayout,
  createDefaultInscriptionElements,
  moveInscription,
} from "@/lib/inscriptions/layout";
import {
  INSCRIPTION_LIMITS,
  inscriptionElementSchema,
  inscriptionElementsSchema,
} from "@/lib/validation/inscriptions";
import type { InscriptionElement } from "@/types/inscription";

const tablet = { width: 48, height: 30 };

function inscription(
  overrides: Partial<InscriptionElement> = {},
): InscriptionElement {
  return {
    id: "name",
    content: "FAMILY NAME",
    xIn: 24,
    yIn: 12,
    fontSizeIn: 2.5,
    ...overrides,
  } as InscriptionElement;
}

function warningKinds(
  warnings: ReturnType<typeof checkInscriptionLayout>,
  id: InscriptionElement["id"],
): string[] {
  return warnings
    .filter((warning) => warning.id === id)
    .map((warning) => warning.kind);
}

describe("inscription validation", () => {
  it("accepts empty single-line content and decimal values at inclusive limits", () => {
    expect(
      inscriptionElementSchema.safeParse(
        inscription({
          content: "",
          xIn: INSCRIPTION_LIMITS.coordinateIn.min,
          yIn: INSCRIPTION_LIMITS.coordinateIn.max,
          fontSizeIn: INSCRIPTION_LIMITS.fontSizeIn.min,
        }),
      ).success,
    ).toBe(true);
    expect(
      inscriptionElementSchema.safeParse(
        inscription({ fontSizeIn: INSCRIPTION_LIMITS.fontSizeIn.max }),
      ).success,
    ).toBe(true);
  });

  it.each([
    ["name", 80],
    ["dates", 80],
    ["epitaph", 160],
  ] as const)("enforces the %s content limit", (id, maximum) => {
    expect(
      inscriptionElementSchema.safeParse(
        inscription({ id, content: "a".repeat(maximum) }),
      ).success,
    ).toBe(true);
    expect(
      inscriptionElementSchema.safeParse(
        inscription({ id, content: "a".repeat(maximum + 1) }),
      ).success,
    ).toBe(false);
  });

  it.each(["line one\nline two", "line one\rline two", "one\u2028two"])(
    "rejects multiline text %j",
    (content) => {
      expect(
        inscriptionElementSchema.safeParse(inscription({ content })).success,
      ).toBe(false);
    },
  );

  it.each([
    ["xIn", -240.000_000_001],
    ["xIn", 240.000_000_001],
    ["yIn", Number.NaN],
    ["yIn", Number.POSITIVE_INFINITY],
    ["fontSizeIn", 0.249_999_999],
    ["fontSizeIn", 12.000_000_001],
  ] as const)("rejects invalid %s value %s", (field, value) => {
    expect(
      inscriptionElementSchema.safeParse(
        inscription({ [field]: value }),
      ).success,
    ).toBe(false);
  });

  it("rejects unknown fields and duplicate inscription identifiers", () => {
    expect(
      inscriptionElementSchema.safeParse({
        ...inscription(),
        unsupported: true,
      }).success,
    ).toBe(false);

    const duplicate = inscriptionElementsSchema.safeParse([
      inscription(),
      inscription({ content: "ANOTHER NAME" }),
    ]);
    expect(duplicate.success).toBe(false);
    if (!duplicate.success) {
      expect(
        duplicate.error.issues.some(
          (issue) => issue.path.join(".") === "1.id",
        ),
      ).toBe(true);
    }
  });
});

describe("inscription defaults and movement", () => {
  it("places defaults by tablet proportions using center anchors and baselines", () => {
    expect(createDefaultInscriptionElements(tablet)).toEqual([
      {
        id: "name",
        content: "FAMILY NAME",
        xIn: 24,
        yIn: 12,
        fontSizeIn: 2.5,
      },
      {
        id: "dates",
        content: "19XX — 20XX",
        xIn: 24,
        yIn: 17.4,
        fontSizeIn: 1.15,
      },
      {
        id: "epitaph",
        content: "",
        xIn: 24,
        yIn: 22.8,
        fontSizeIn: 1,
      },
    ]);
  });

  it("preserves decimals and caps repeated movement drift at 1e-9 inches", () => {
    const original = inscription({
      xIn: 12.345_678_901,
      yIn: 8.765_432_109,
    });
    let moved = original;
    for (let step = 0; step < 100; step += 1) {
      moved = moveInscription(moved, 0.1, -0.1);
    }

    expect(moved.xIn).toBe(22.345_678_901);
    expect(moved.yIn).toBe(-1.234_567_891);
    expect(moved.content).toBe("FAMILY NAME");
    expect(moved.fontSizeIn).toBe(2.5);
    expect(original).toEqual(
      inscription({ xIn: 12.345_678_901, yIn: 8.765_432_109 }),
    );

    for (let step = 0; step < 100; step += 1) {
      moved = moveInscription(moved, -0.1, 0.1);
    }
    expect(moved.xIn).toBe(original.xIn);
    expect(moved.yIn).toBe(original.yIn);
  });

  it("validates both movement deltas and the moved result", () => {
    expect(() => moveInscription(inscription(), Number.NaN, 0)).toThrow(
      RangeError,
    );
    expect(() => moveInscription(inscription({ xIn: 239 }), 2, 0)).toThrow();
  });
});

describe("inscription layout warnings", () => {
  it("uses supplied renderer bounds without estimating text dimensions", () => {
    const warnings = checkInscriptionLayout(
      [inscription()],
      { name: { x: 1, y: 1, width: 46, height: 28 } },
      tablet,
    );

    expect(warnings).toEqual([]);
  });

  it("distinguishes the real face from the provisional inset guide", () => {
    const marginOnly = checkInscriptionLayout(
      [inscription()],
      { name: { x: 0.5, y: 5, width: 20, height: 3 } },
      tablet,
    );
    expect(warningKinds(marginOnly, "name")).toEqual(["margin"]);

    const outside = checkInscriptionLayout(
      [inscription()],
      { name: { x: -0.25, y: 5, width: 20, height: 3 } },
      tablet,
    );
    expect(warningKinds(outside, "name")).toEqual([
      "outside-face",
      "margin",
    ]);
  });

  it("treats exact face and guide edges as inside", () => {
    expect(
      checkInscriptionLayout(
        [inscription()],
        { name: { x: 1, y: 1, width: 46, height: 28 } },
        tablet,
      ),
    ).toEqual([]);
  });

  it("warns for blank required text and skips its measurement and overlap checks", () => {
    const elements = [
      inscription({ id: "name", content: "   " }),
      inscription({ id: "dates", content: "1900 — 1980" }),
    ];
    const warnings = checkInscriptionLayout(
      elements,
      {
        name: { x: 10, y: 10, width: 20, height: 4 },
        dates: { x: 10, y: 10, width: 20, height: 4 },
      },
      tablet,
    );

    expect(warningKinds(warnings, "name")).toEqual(["empty"]);
    expect(warningKinds(warnings, "dates")).toEqual([]);
  });

  it("allows an empty optional epitaph without requesting measurements", () => {
    const warnings = checkInscriptionLayout(
      [inscription({ id: "epitaph", content: "   " })],
      {},
      tablet,
    );

    expect(warnings).toEqual([]);
  });

  it("reports missing or invalid renderer measurements", () => {
    const missing = checkInscriptionLayout([inscription()], {}, tablet);
    expect(warningKinds(missing, "name")).toEqual(["unmeasured"]);

    const invalid = checkInscriptionLayout(
      [inscription()],
      { name: { x: 1, y: 1, width: Number.NaN, height: 3 } },
      tablet,
    );
    expect(warningKinds(invalid, "name")).toEqual(["unmeasured"]);
  });

  it("emits overlap warnings for both measured nonblank elements", () => {
    const warnings = checkInscriptionLayout(
      [
        inscription({ id: "name" }),
        inscription({ id: "dates", content: "1900 — 1980" }),
      ],
      {
        name: { x: 10.25, y: 9.5, width: 20.5, height: 4.25 },
        dates: { x: 25, y: 12, width: 12, height: 2 },
      },
      tablet,
    );

    expect(warningKinds(warnings, "name")).toEqual(["overlap"]);
    expect(warningKinds(warnings, "dates")).toEqual(["overlap"]);
  });

  it("does not treat rectangles that only touch as overlapping", () => {
    const warnings = checkInscriptionLayout(
      [
        inscription({ id: "name" }),
        inscription({ id: "dates", content: "1900 — 1980" }),
      ],
      {
        name: { x: 10, y: 8, width: 20, height: 3 },
        dates: { x: 10, y: 11, width: 20, height: 3 },
      },
      tablet,
    );

    expect(warnings).toEqual([]);
  });

  it("rejects invalid tablet and guide dimensions", () => {
    expect(() =>
      checkInscriptionLayout([inscription()], {}, { width: 0, height: 30 }),
    ).toThrow(RangeError);
    expect(() =>
      checkInscriptionLayout([inscription()], {}, tablet, -0.01),
    ).toThrow(RangeError);
  });
});
