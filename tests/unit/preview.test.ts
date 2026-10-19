import { describe, expect, it } from "vitest";

import {
  PREVIEW_LAYOUT,
  createPreviewTransforms,
} from "@/lib/geometry/preview";
import {
  rectInchesToCanvas,
  type CanvasTransform,
} from "@/lib/geometry/scaling";
import { createStraightTopUprightGeometry } from "@/lib/geometry/straight-top";
import type {
  MonumentDimensionsInches,
  ProfileInches,
} from "@/types/design";

const cases: Array<{
  name: string;
  dimensions: MonumentDimensionsInches;
  expectedPixelsPerInch: number;
}> = [
  {
    name: "minimum dimensions",
    dimensions: {
      tablet: { width: 12, height: 12, thickness: 2 },
      base: { width: 12, height: 2, depth: 4 },
    },
    expectedPixelsPerInch: 402 / 14,
  },
  {
    name: "maximum dimensions",
    dimensions: {
      tablet: { width: 120, height: 96, thickness: 24 },
      base: { width: 144, height: 24, depth: 48 },
    },
    expectedPixelsPerInch: 142 / 48,
  },
  {
    name: "fractional dimensions",
    dimensions: {
      tablet: { width: 40.5, height: 28.25, thickness: 7.5 },
      base: { width: 47.75, height: 7.25, depth: 10.125 },
    },
    expectedPixelsPerInch: 540 / 47.75,
  },
];

function expectProjectionInvariants(
  profile: ProfileInches,
  transform: CanvasTransform,
): void {
  const tablet = rectInchesToCanvas(profile.tablet, transform);
  const base = rectInchesToCanvas(profile.base, transform);
  const renderedRight =
    transform.originPx.x + profile.bounds.width * transform.pixelsPerInch;
  const renderedBottom =
    transform.originPx.y + profile.bounds.height * transform.pixelsPerInch;

  expect(tablet.x + tablet.width / 2).toBeCloseTo(
    base.x + base.width / 2,
    10,
  );
  expect(tablet.y + tablet.height).toBeCloseTo(base.y, 10);

  expect(transform.originPx.x).toBeGreaterThanOrEqual(transform.insetsPx.left);
  expect(transform.originPx.y).toBeGreaterThanOrEqual(transform.insetsPx.top);
  expect(renderedRight).toBeLessThanOrEqual(
    transform.viewportPx.width - transform.insetsPx.right + 1e-10,
  );
  expect(renderedBottom).toBeLessThanOrEqual(
    transform.viewportPx.height - transform.insetsPx.bottom + 1e-10,
  );

  const leftGap = transform.originPx.x - transform.insetsPx.left;
  const rightGap =
    transform.viewportPx.width - transform.insetsPx.right - renderedRight;
  const topGap = transform.originPx.y - transform.insetsPx.top;
  const bottomGap =
    transform.viewportPx.height - transform.insetsPx.bottom - renderedBottom;
  expect(leftGap).toBeCloseTo(rightGap, 10);
  expect(topGap).toBeCloseTo(bottomGap, 10);
}

describe.each(cases)("preview transforms at $name", ({
  dimensions,
  expectedPixelsPerInch,
}) => {
  it("uses one scale and preserves center, contact, and inset containment", () => {
    const geometry = createStraightTopUprightGeometry(dimensions);
    const transforms = createPreviewTransforms(geometry);

    expect(transforms.pixelsPerInch).toBeCloseTo(
      expectedPixelsPerInch,
      10,
    );
    expect(transforms.front.pixelsPerInch).toBe(transforms.pixelsPerInch);
    expect(transforms.side.pixelsPerInch).toBe(transforms.pixelsPerInch);

    expectProjectionInvariants(geometry.front, transforms.front);
    expectProjectionInvariants(geometry.side, transforms.side);

    const frontBottom =
      PREVIEW_LAYOUT.front.offsetY +
      transforms.front.originPx.y +
      geometry.front.bounds.height * transforms.pixelsPerInch;
    const sideBottom =
      PREVIEW_LAYOUT.side.offsetY +
      transforms.side.originPx.y +
      geometry.side.bounds.height * transforms.pixelsPerInch;
    expect(frontBottom).toBeCloseTo(sideBottom, 10);
  });
});
