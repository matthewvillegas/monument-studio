import type { PointInches, RectInches, SizeInches } from "@/types/design";

export interface SizePixels {
  width: number;
  height: number;
}

export interface PointPixels {
  x: number;
  y: number;
}

export interface InsetsPixels {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface CanvasTransform {
  pixelsPerInch: number;
  originPx: PointPixels;
  contentInches: SizeInches;
  viewportPx: SizePixels;
  insetsPx: InsetsPixels;
}

export interface RectPixels extends PointPixels, SizePixels {}

const ZERO_INSETS: InsetsPixels = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

function assertPositiveFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive finite number.`);
  }
}

function normalizeInsets(
  insets: Partial<InsetsPixels> = {},
): InsetsPixels {
  const normalized = { ...ZERO_INSETS, ...insets };

  for (const [edge, value] of Object.entries(normalized)) {
    if (!Number.isFinite(value) || value < 0) {
      throw new RangeError(`${edge} inset must be a non-negative finite number.`);
    }
  }

  return normalized;
}

export function fitPixelsPerInch(
  contentInches: SizeInches,
  viewportPx: SizePixels,
  insetsPx: Partial<InsetsPixels> = {},
): number {
  assertPositiveFinite(contentInches.width, "Content width");
  assertPositiveFinite(contentInches.height, "Content height");
  assertPositiveFinite(viewportPx.width, "Viewport width");
  assertPositiveFinite(viewportPx.height, "Viewport height");

  const insets = normalizeInsets(insetsPx);
  const availableWidth = viewportPx.width - insets.left - insets.right;
  const availableHeight = viewportPx.height - insets.top - insets.bottom;

  assertPositiveFinite(availableWidth, "Available viewport width");
  assertPositiveFinite(availableHeight, "Available viewport height");

  return Math.min(
    availableWidth / contentInches.width,
    availableHeight / contentInches.height,
  );
}

export function createCanvasTransform({
  contentInches,
  viewportPx,
  insetsPx = {},
  pixelsPerInch,
}: {
  contentInches: SizeInches;
  viewportPx: SizePixels;
  insetsPx?: Partial<InsetsPixels>;
  pixelsPerInch?: number;
}): CanvasTransform {
  const insets = normalizeInsets(insetsPx);
  const fittedScale = fitPixelsPerInch(contentInches, viewportPx, insets);
  const scale = pixelsPerInch ?? fittedScale;

  assertPositiveFinite(scale, "Pixels per inch");
  if (scale > fittedScale + Number.EPSILON) {
    throw new RangeError("Pixels per inch exceeds the fitted canvas scale.");
  }

  const availableWidth = viewportPx.width - insets.left - insets.right;
  const availableHeight = viewportPx.height - insets.top - insets.bottom;
  const renderedWidth = contentInches.width * scale;
  const renderedHeight = contentInches.height * scale;

  return {
    pixelsPerInch: scale,
    originPx: {
      x: insets.left + (availableWidth - renderedWidth) / 2,
      y: insets.top + (availableHeight - renderedHeight) / 2,
    },
    contentInches: { ...contentInches },
    viewportPx: { ...viewportPx },
    insetsPx: insets,
  };
}

export function inchesToPixels(
  inches: number,
  transform: Pick<CanvasTransform, "pixelsPerInch">,
): number {
  if (!Number.isFinite(inches)) {
    throw new RangeError("Inches must be finite.");
  }
  assertPositiveFinite(transform.pixelsPerInch, "Pixels per inch");
  return inches * transform.pixelsPerInch;
}

export function pixelsToInches(
  pixels: number,
  transform: Pick<CanvasTransform, "pixelsPerInch">,
): number {
  if (!Number.isFinite(pixels)) {
    throw new RangeError("Pixels must be finite.");
  }
  assertPositiveFinite(transform.pixelsPerInch, "Pixels per inch");
  return pixels / transform.pixelsPerInch;
}

export function pointInchesToCanvas(
  point: PointInches,
  transform: CanvasTransform,
): PointPixels {
  return {
    x: transform.originPx.x + inchesToPixels(point.x, transform),
    y: transform.originPx.y + inchesToPixels(point.y, transform),
  };
}

export function rectInchesToCanvas(
  rect: RectInches,
  transform: CanvasTransform,
): RectPixels {
  const origin = pointInchesToCanvas(rect, transform);
  return {
    ...origin,
    width: inchesToPixels(rect.width, transform),
    height: inchesToPixels(rect.height, transform),
  };
}
