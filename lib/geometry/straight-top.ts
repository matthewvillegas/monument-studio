import { assertValidDimensions } from "@/lib/validation/dimensions";
import type {
  MonumentDimensionsInches,
  ProfileInches,
  StraightTopUprightGeometry,
} from "@/types/design";

function createProfile(
  tabletWidth: number,
  tabletHeight: number,
  baseWidth: number,
  baseHeight: number,
): ProfileInches {
  const width = Math.max(tabletWidth, baseWidth);
  const height = tabletHeight + baseHeight;

  return {
    units: "in",
    bounds: { width, height },
    tablet: {
      x: (width - tabletWidth) / 2,
      y: 0,
      width: tabletWidth,
      height: tabletHeight,
    },
    base: {
      x: (width - baseWidth) / 2,
      y: tabletHeight,
      width: baseWidth,
      height: baseHeight,
    },
  };
}

export function createStraightTopUprightGeometry(
  input: MonumentDimensionsInches,
): StraightTopUprightGeometry {
  const dimensions = assertValidDimensions(input);
  const { tablet, base } = dimensions;
  const front = createProfile(
    tablet.width,
    tablet.height,
    base.width,
    base.height,
  );
  const side = createProfile(
    tablet.thickness,
    tablet.height,
    base.depth,
    base.height,
  );

  return {
    kind: "upright-straight",
    dimensions,
    overall: {
      width: front.bounds.width,
      height: front.bounds.height,
      depth: side.bounds.width,
    },
    front,
    side,
  };
}
