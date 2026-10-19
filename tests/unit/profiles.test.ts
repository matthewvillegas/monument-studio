import { describe, expect, it } from "vitest";

import { DEMO_DESIGN } from "@/data/mock-designer";
import { createPreviewTransforms } from "@/lib/geometry/preview";
import { faceContainsRect, getLayoutGuide } from "@/lib/geometry/profile-guide";
import {
  createMonumentGeometry,
  getTabletProfileAreaIn2,
} from "@/lib/geometry/profiles";
import { createStraightTopUprightGeometry } from "@/lib/geometry/straight-top";
import { validateProfile } from "@/lib/validation/profile";
import type { MonumentDimensionsInches } from "@/types/design";
import type { MonumentProfile } from "@/types/profile";

const straight = { kind: "upright-straight" } as const;
const oval = { kind: "upright-oval", capRiseIn: 12 } as const;

describe("analytical profile validation", () => {
  it("permits decimal and full-height caps, but no body below zero", () => {
    expect(
      validateProfile({ kind: "upright-oval", capRiseIn: 7.125 }, 12).success,
    ).toBe(true);
    expect(
      validateProfile({ kind: "upright-oval", capRiseIn: 12 }, 12).success,
    ).toBe(true);
    expect(
      validateProfile({ kind: "upright-oval", capRiseIn: 12.00001 }, 12)
        .success,
    ).toBe(false);
  });

  it("rejects nonfinite, missing, nonnumeric, and nonpositive cap rise", () => {
    for (const capRiseIn of [
      NaN,
      Infinity,
      -Infinity,
      undefined,
      "12",
      0,
      -1,
    ]) {
      expect(
        validateProfile({ kind: "upright-oval", capRiseIn }, 30).success,
      ).toBe(false);
    }
    for (const height of [NaN, Infinity, 0, -1]) {
      expect(validateProfile(straight, height).success).toBe(false);
    }
  });

  it("rejects unknown kinds and unknown properties without coercion", () => {
    for (const input of [
      null,
      {},
      { kind: "slant" },
      { ...straight, capRiseIn: 12 },
      { ...oval, extra: 1 },
    ]) {
      expect(validateProfile(input, 30).success).toBe(false);
    }
  });
});

describe("shared upright geometry", () => {
  it("retains every original straight-top geometry value", () => {
    const current = createMonumentGeometry(DEMO_DESIGN.dimensions, straight);
    const original = createStraightTopUprightGeometry(DEMO_DESIGN.dimensions);
    expect(current).toEqual({ ...original, profile: straight });
  });

  const cases: [string, MonumentDimensionsInches, number][] = [
    [
      "minimum",
      {
        tablet: { width: 12, height: 12, thickness: 2 },
        base: { width: 12, height: 2, depth: 4 },
      },
      12,
    ],
    [
      "maximum",
      {
        tablet: { width: 120, height: 96, thickness: 24 },
        base: { width: 144, height: 24, depth: 48 },
      },
      96,
    ],
    [
      "decimal",
      {
        tablet: { width: 40.5, height: 28.25, thickness: 7.5 },
        base: { width: 47.75, height: 7.25, depth: 10.125 },
      },
      7.125,
    ],
  ];

  it.each(cases)(
    "preserves contact, centering, and shared scale at %s dimensions",
    (_name, dimensions, capRiseIn) => {
      const geometry = createMonumentGeometry(dimensions, {
        kind: "upright-oval",
        capRiseIn,
      });
      const transforms = createPreviewTransforms(geometry);
      expect(geometry.overall).toEqual({
        width: dimensions.base.width,
        height: dimensions.tablet.height + dimensions.base.height,
        depth: dimensions.base.depth,
      });
      expect(geometry.front.tablet.width).toBe(dimensions.tablet.width);
      expect(geometry.side.tablet.width).toBe(dimensions.tablet.thickness);
      for (const projection of [geometry.front, geometry.side]) {
        expect(projection.tablet.x + projection.tablet.width / 2).toBe(
          projection.base.x + projection.base.width / 2,
        );
        expect(projection.tablet.y + projection.tablet.height).toBe(
          projection.base.y,
        );
        expect(projection.tablet.height).toBe(dimensions.tablet.height);
      }
      expect(transforms.front.pixelsPerInch).toBe(
        transforms.side.pixelsPerInch,
      );
      expect(Number.isFinite(transforms.pixelsPerInch)).toBe(true);
      expect(transforms.pixelsPerInch).toBeGreaterThan(0);
    },
  );

  it("rejects invalid dimensions and invalid cap rise before producing geometry", () => {
    expect(() =>
      createMonumentGeometry(
        {
          ...DEMO_DESIGN.dimensions,
          base: { width: 12, height: 8, depth: 14 },
        },
        oval,
      ),
    ).toThrow();
    expect(() =>
      createMonumentGeometry(DEMO_DESIGN.dimensions, {
        kind: "upright-oval",
        capRiseIn: 31,
      }),
    ).toThrow();
  });

  it("matches rectangle, semicircle, and half-ellipse reference areas", () => {
    expect(getTabletProfileAreaIn2(DEMO_DESIGN.dimensions, straight)).toBe(
      1440,
    );
    const semicircle = {
      tablet: { width: 24, height: 12, thickness: 2 },
      base: { width: 24, height: 2, depth: 4 },
    };
    // A half circle of radius 12 has area 72 pi, independently of body math.
    expect(getTabletProfileAreaIn2(semicircle, oval)).toBeCloseTo(
      226.1946710584651,
      10,
    );
    const ellipse = {
      ...semicircle,
      tablet: { ...semicircle.tablet, height: 24 },
    };
    expect(
      getTabletProfileAreaIn2(ellipse, { kind: "upright-oval", capRiseIn: 24 }),
    ).toBeCloseTo(452.3893421169302, 10);
  });

  it("approaches the rectangular area continuously for a vanishing cap", () => {
    for (const capRiseIn of [1e-9, 1e-100, Number.MIN_VALUE]) {
      const area = getTabletProfileAreaIn2(DEMO_DESIGN.dimensions, {
        kind: "upright-oval",
        capRiseIn,
      });
      expect(Number.isFinite(area)).toBe(true);
      expect(area).toBeCloseTo(1440, 7);
      expect(area).toBeLessThanOrEqual(1440);
    }
  });
});

describe("profile-aware containment and square-clearance guide", () => {
  const face = { width: 48, height: 30 };

  it("checks the whole rectangle rather than its center or enclosing tablet box", () => {
    expect(
      faceContainsRect(face, oval, { x: 1, y: 1, width: 4, height: 1 }),
    ).toBe(false);
    expect(
      faceContainsRect(face, straight, { x: 1, y: 1, width: 4, height: 1 }),
    ).toBe(true);
    expect(
      faceContainsRect(face, oval, { x: 10, y: 10, width: 28, height: 10 }),
    ).toBe(true);
    expect(
      faceContainsRect(face, oval, { x: 10, y: 10, width: 28, height: 21 }),
    ).toBe(false);
  });

  it("includes the crown, shoulders, and their continuous body contact", () => {
    expect(
      faceContainsRect(face, oval, { x: 24, y: 0, width: 0, height: 30 }),
    ).toBe(true);
    expect(
      faceContainsRect(face, oval, { x: 0, y: 12, width: 48, height: 18 }),
    ).toBe(true);
    expect(
      faceContainsRect(face, oval, {
        x: 0,
        y: 12 - 1e-7,
        width: 48,
        height: 1,
      }),
    ).toBe(false);
    // At x=9.6 the normalized displacement is -0.6; sqrt(1-0.36)=0.8.
    expect(
      faceContainsRect(face, oval, { x: 9.6, y: 2.4, width: 28.8, height: 1 }),
    ).toBe(true);
    expect(
      faceContainsRect(face, oval, {
        x: 9.6,
        y: 2.4 - 1e-7,
        width: 28.8,
        height: 1,
      }),
    ).toBe(false);
  });

  it("uses expanded-box margins and retains exact rectangular guide behavior", () => {
    expect(getLayoutGuide(face, straight)).toEqual({
      kind: "rectangle",
      rect: { x: 1, y: 1, width: 46, height: 28 },
    });
    expect(
      faceContainsRect(
        face,
        straight,
        { x: 1, y: 1, width: 46, height: 28 },
        1,
      ),
    ).toBe(true);
    expect(
      faceContainsRect(
        face,
        straight,
        { x: 0.999, y: 1, width: 1, height: 1 },
        1,
      ),
    ).toBe(false);
    expect(
      faceContainsRect(face, oval, { x: 1, y: 13, width: 46, height: 16 }, 1),
    ).toBe(true);
    expect(
      faceContainsRect(
        face,
        oval,
        { x: 1, y: 12.999, width: 46, height: 1 },
        1,
      ),
    ).toBe(false);
  });

  it("constructs both analytic guide arcs with endpoints on the containment boundary", () => {
    const guide = getLayoutGuide(face, oval);
    expect(guide.kind).toBe("oval");
    if (guide.kind !== "oval") throw new Error("Expected oval guide");
    expect(guide.leftIn).toBe(1);
    expect(guide.rightIn).toBe(47);
    expect(guide.edgeYIn).toBe(13);
    expect(guide.bottomIn).toBe(29);
    expect(guide.radiusXIn).toBe(24);
    expect(guide.radiusYIn).toBe(12);
    // At the center the required top clearance is slightly MORE than 1 in:
    // the square's corners, not only its center, must clear the curved cap.
    expect(guide.topYIn).toBeCloseTo(1 + 12 * (1 - Math.sqrt(575 / 576)), 12);
    for (const [x, y] of [
      [guide.leftIn, guide.edgeYIn],
      [guide.centerXIn, guide.topYIn],
      [guide.rightIn, guide.edgeYIn],
    ]) {
      expect(
        faceContainsRect(face, oval, { x: x!, y: y!, width: 0, height: 0 }, 1),
      ).toBe(true);
      expect(
        faceContainsRect(
          face,
          oval,
          { x: x!, y: y! - 1e-7, width: 0, height: 0 },
          1,
        ),
      ).toBe(false);
    }
  });

  it("clips a full-height cap guide where the curved upper edge meets the bottom", () => {
    const cap = { kind: "upright-oval", capRiseIn: 30 } as const;
    const guide = getLayoutGuide(face, cap);
    expect(guide.kind).toBe("oval");
    if (guide.kind !== "oval") throw new Error("Expected oval guide");
    expect(guide.leftIn).toBeGreaterThan(1);
    expect(guide.edgeYIn).toBeCloseTo(guide.bottomIn, 10);
    expect(guide.leftIn + guide.rightIn).toBe(face.width);
    expect(
      faceContainsRect(
        face,
        cap,
        { x: guide.leftIn, y: guide.bottomIn, width: 0, height: 0 },
        1,
      ),
    ).toBe(true);
    expect(
      faceContainsRect(
        face,
        cap,
        { x: guide.leftIn - 1e-6, y: guide.bottomIn, width: 0, height: 0 },
        1,
      ),
    ).toBe(false);
  });

  it("keeps a tiny-rise guide finite without cancellation or NaN", () => {
    for (const capRiseIn of [1e-9, 1e-100, Number.MIN_VALUE]) {
      const guide = getLayoutGuide(face, { kind: "upright-oval", capRiseIn });
      if (guide.kind !== "oval") throw new Error("Expected oval guide");
      for (const [key, value] of Object.entries(guide)) {
        if (key !== "kind") expect(Number.isFinite(value)).toBe(true);
      }
      expect(guide.topYIn).toBeGreaterThanOrEqual(1);
      expect(guide.edgeYIn).toBeCloseTo(1, 7);
    }
  });

  it("returns an empty guide when no positive-area clearance region remains", () => {
    expect(getLayoutGuide({ width: 12, height: 12 }, straight, 6)).toEqual({
      kind: "empty",
    });
    // Width/height alone leave a 2x2 rectangle, but a full semicircle does not.
    expect(
      getLayoutGuide(
        { width: 12, height: 12 },
        { kind: "upright-oval", capRiseIn: 12 },
        5,
      ),
    ).toEqual({ kind: "empty" });
  });

  it("rejects invalid face/margin/profile and fails closed for invalid measured rectangles", () => {
    for (const margin of [-1, NaN, Infinity]) {
      expect(() => getLayoutGuide(face, oval, margin)).toThrow();
      expect(() =>
        faceContainsRect(
          face,
          oval,
          { x: 1, y: 1, width: 1, height: 1 },
          margin,
        ),
      ).toThrow();
    }
    expect(() => getLayoutGuide({ width: 0, height: 30 }, oval)).toThrow();
    expect(() =>
      getLayoutGuide(face, { kind: "upright-oval", capRiseIn: 31 }),
    ).toThrow();
    for (const rect of [
      { x: NaN, y: 1, width: 1, height: 1 },
      { x: 1, y: Infinity, width: 1, height: 1 },
      { x: 1, y: 1, width: -1, height: 1 },
    ]) {
      expect(faceContainsRect(face, oval, rect)).toBe(false);
    }
  });

  it("has matching analytic guide and containment throughout decimal and extreme faces", () => {
    for (const [width, height, rise, margin] of [
      [12, 12, 12, 1],
      [120, 96, 96, 1],
      [40.5, 28.25, 7.125, 0.625],
      [48, 30, 29.5, 1],
    ]) {
      const size = { width: width!, height: height! };
      const profile: MonumentProfile = {
        kind: "upright-oval",
        capRiseIn: rise!,
      };
      const guide = getLayoutGuide(size, profile, margin!);
      if (guide.kind !== "oval") throw new Error("Expected oval guide");
      for (let i = 0; i <= 20; i++) {
        const x = guide.leftIn + ((guide.rightIn - guide.leftIn) * i) / 20;
        const u = (Math.abs(x - width! / 2) + margin!) / (width! / 2);
        const y = margin! + rise! * (1 - Math.sqrt(Math.max(0, 1 - u * u)));
        expect(
          faceContainsRect(
            size,
            profile,
            { x, y, width: 0, height: 0 },
            margin!,
          ),
          JSON.stringify({ width, height, rise, margin, x, y }),
        ).toBe(true);
        expect(
          faceContainsRect(
            size,
            profile,
            { x, y: y - 1e-7, width: 0, height: 0 },
            margin!,
          ),
        ).toBe(false);
      }
    }
  });
});
