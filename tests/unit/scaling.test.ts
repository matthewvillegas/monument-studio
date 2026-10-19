import { describe, expect, it } from "vitest";

import {
  createCanvasTransform,
  fitPixelsPerInch,
  inchesToPixels,
  pixelsToInches,
  pointInchesToCanvas,
  rectInchesToCanvas,
} from "@/lib/geometry/scaling";

const content = { width: 48, height: 38 };
const viewport = { width: 560, height: 460 };
const insets = { top: 40, right: 40, bottom: 40, left: 40 };

describe("inches-to-canvas scaling", () => {
  it("fits content using one uniform pixels-per-inch scale", () => {
    expect(fitPixelsPerInch(content, viewport, insets)).toBe(10);
  });

  it("centers the fitted content inside the inset viewport", () => {
    const transform = createCanvasTransform({
      contentInches: content,
      viewportPx: viewport,
      insetsPx: insets,
    });

    expect(transform.pixelsPerInch).toBe(10);
    expect(transform.originPx).toEqual({ x: 40, y: 40 });
  });

  it("letterboxes on the unconstrained axis while keeping the scale uniform", () => {
    const transform = createCanvasTransform({
      contentInches: { width: 30, height: 38 },
      viewportPx: viewport,
      insetsPx: insets,
    });

    expect(transform.pixelsPerInch).toBe(10);
    expect(transform.originPx).toEqual({ x: 130, y: 40 });
  });

  it("converts inches and pixels in both directions without rounding", () => {
    const transform = { pixelsPerInch: 8.75 };
    const inches = 12.375;
    const pixels = inchesToPixels(inches, transform);

    expect(pixels).toBeCloseTo(108.28125, 10);
    expect(pixelsToInches(pixels, transform)).toBeCloseTo(inches, 10);
    expect(inchesToPixels(0, transform)).toBe(0);
  });

  it("maps points and rectangles through the centralized transform", () => {
    const transform = createCanvasTransform({
      contentInches: content,
      viewportPx: viewport,
      insetsPx: insets,
    });

    expect(pointInchesToCanvas({ x: 4, y: 3 }, transform)).toEqual({
      x: 80,
      y: 70,
    });
    expect(
      rectInchesToCanvas(
        { x: 4, y: 3, width: 20, height: 10 },
        transform,
      ),
    ).toEqual({ x: 80, y: 70, width: 200, height: 100 });
  });

  it("supports one explicit scale shared by separate projections", () => {
    const frontScale = fitPixelsPerInch(
      { width: 60, height: 38 },
      { width: 680, height: 460 },
      insets,
    );
    const sharedScale = Math.min(frontScale, 8);
    const front = createCanvasTransform({
      contentInches: { width: 60, height: 38 },
      viewportPx: { width: 680, height: 460 },
      insetsPx: insets,
      pixelsPerInch: sharedScale,
    });
    const side = createCanvasTransform({
      contentInches: { width: 14, height: 38 },
      viewportPx: { width: 200, height: 460 },
      insetsPx: { top: 40, right: 20, bottom: 40, left: 20 },
      pixelsPerInch: sharedScale,
    });

    expect(inchesToPixels(14, front)).toBe(inchesToPixels(14, side));
  });

  it.each([
    [{ width: 0, height: 10 }, viewport, insets],
    [{ width: -1, height: 10 }, viewport, insets],
    [{ width: Number.NaN, height: 10 }, viewport, insets],
    [{ width: Number.POSITIVE_INFINITY, height: 10 }, viewport, insets],
    [content, { width: 0, height: 100 }, insets],
    [content, viewport, { top: -1, right: 0, bottom: 0, left: 0 }],
    [content, viewport, { top: 230, right: 0, bottom: 230, left: 0 }],
  ])("rejects invalid fit inputs", (badContent, badViewport, badInsets) => {
    expect(() =>
      fitPixelsPerInch(badContent, badViewport, badInsets),
    ).toThrow(RangeError);
  });

  it("rejects an explicit scale that would overflow the fitted viewport", () => {
    expect(() =>
      createCanvasTransform({
        contentInches: content,
        viewportPx: viewport,
        insetsPx: insets,
        pixelsPerInch: 11,
      }),
    ).toThrow(RangeError);
  });
});
