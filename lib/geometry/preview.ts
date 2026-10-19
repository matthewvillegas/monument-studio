import {
  createCanvasTransform,
  fitPixelsPerInch,
  type CanvasTransform,
  type InsetsPixels,
  type SizePixels,
} from "@/lib/geometry/scaling";
import type { StraightTopUprightGeometry } from "@/types/design";

interface PreviewRegion {
  viewport: SizePixels;
  insets: InsetsPixels;
  offsetX: number;
  offsetY: number;
}

export const PREVIEW_LAYOUT = {
  viewBox: { width: 960, height: 610 },
  front: {
    viewport: { width: 700, height: 560 },
    insets: { top: 76, right: 66, bottom: 82, left: 94 },
    offsetX: 0,
    offsetY: 12,
  },
  side: {
    viewport: { width: 210, height: 560 },
    insets: { top: 76, right: 34, bottom: 82, left: 34 },
    offsetX: 728,
    offsetY: 12,
  },
} as const satisfies {
  viewBox: SizePixels;
  front: PreviewRegion;
  side: PreviewRegion;
};

export interface PreviewTransforms {
  pixelsPerInch: number;
  front: CanvasTransform;
  side: CanvasTransform;
}

export function createPreviewTransforms(
  geometry: Pick<StraightTopUprightGeometry, "front" | "side">,
): PreviewTransforms {
  const frontFit = fitPixelsPerInch(
    geometry.front.bounds,
    PREVIEW_LAYOUT.front.viewport,
    PREVIEW_LAYOUT.front.insets,
  );
  const sideFit = fitPixelsPerInch(
    geometry.side.bounds,
    PREVIEW_LAYOUT.side.viewport,
    PREVIEW_LAYOUT.side.insets,
  );
  const pixelsPerInch = Math.min(frontFit, sideFit);

  return {
    pixelsPerInch,
    front: createCanvasTransform({
      contentInches: geometry.front.bounds,
      viewportPx: PREVIEW_LAYOUT.front.viewport,
      insetsPx: PREVIEW_LAYOUT.front.insets,
      pixelsPerInch,
    }),
    side: createCanvasTransform({
      contentInches: geometry.side.bounds,
      viewportPx: PREVIEW_LAYOUT.side.viewport,
      insetsPx: PREVIEW_LAYOUT.side.insets,
      pixelsPerInch,
    }),
  };
}
