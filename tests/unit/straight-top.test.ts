import { describe, expect, it } from "vitest";

import { DEMO_DESIGN } from "@/data/mock-designer";
import {
  createCanvasTransform,
  rectInchesToCanvas,
} from "@/lib/geometry/scaling";
import { createStraightTopUprightGeometry } from "@/lib/geometry/straight-top";

describe("straight-top upright geometry", () => {
  it("creates exact centered front and side profiles", () => {
    const geometry = createStraightTopUprightGeometry(DEMO_DESIGN.dimensions);

    expect(geometry.overall).toEqual({ width: 60, height: 38, depth: 14 });
    expect(geometry.front.bounds).toEqual({ width: 60, height: 38 });
    expect(geometry.front.tablet).toEqual({
      x: 6,
      y: 0,
      width: 48,
      height: 30,
    });
    expect(geometry.front.base).toEqual({
      x: 0,
      y: 30,
      width: 60,
      height: 8,
    });
    expect(geometry.side.bounds).toEqual({ width: 14, height: 38 });
    expect(geometry.side.tablet).toEqual({
      x: 3,
      y: 0,
      width: 8,
      height: 30,
    });
  });

  it("keeps the tablet centered on and directly aligned with the base", () => {
    const geometry = createStraightTopUprightGeometry(DEMO_DESIGN.dimensions);
    const tabletCenter =
      geometry.front.tablet.x + geometry.front.tablet.width / 2;
    const baseCenter = geometry.front.base.x + geometry.front.base.width / 2;

    expect(tabletCenter).toBe(baseCenter);
    expect(geometry.front.tablet.y + geometry.front.tablet.height).toBe(
      geometry.front.base.y,
    );
  });

  it("maps the exact profile through the scale utility", () => {
    const geometry = createStraightTopUprightGeometry(DEMO_DESIGN.dimensions);
    const transform = createCanvasTransform({
      contentInches: geometry.front.bounds,
      viewportPx: { width: 680, height: 460 },
      insetsPx: { top: 40, right: 40, bottom: 40, left: 40 },
    });

    expect(transform.pixelsPerInch).toBe(10);
    expect(rectInchesToCanvas(geometry.front.tablet, transform)).toEqual({
      x: 100,
      y: 40,
      width: 480,
      height: 300,
    });
    expect(rectInchesToCanvas(geometry.front.base, transform)).toEqual({
      x: 40,
      y: 340,
      width: 600,
      height: 80,
    });
  });

  it("rejects geometry that violates dimension validation", () => {
    expect(() =>
      createStraightTopUprightGeometry({
        tablet: { width: 50, height: 30, thickness: 8 },
        base: { width: 48, height: 8, depth: 14 },
      }),
    ).toThrow();
  });
});
