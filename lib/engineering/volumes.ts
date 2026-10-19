import { getTabletProfileAreaIn2 } from "@/lib/geometry/profiles";
import { assertValidDimensions } from "@/lib/validation/dimensions";
import type { MonumentDimensionsInches } from "@/types/design";
import type { MonumentProfile } from "@/types/profile";

export const CUBIC_INCHES_PER_CUBIC_FOOT = 12 ** 3;

export function cubicInchesToCubicFeet(volumeIn3: number): number {
  if (!Number.isFinite(volumeIn3) || volumeIn3 < 0) {
    throw new RangeError("Volume must be non-negative and finite.");
  }
  return volumeIn3 / CUBIC_INCHES_PER_CUBIC_FOOT;
}

export interface NominalVolumes {
  tabletAreaIn2: number;
  tabletVolumeIn3: number;
  baseVolumeIn3: number;
  totalVolumeIn3: number;
  tabletVolumeFt3: number;
  baseVolumeFt3: number;
  totalVolumeFt3: number;
}

/**
 * Nominal solid material only: uniform tablet extrusion and rectangular base.
 * Excludes carving, holes, bevels, joints, adhesives, fabrication allowances,
 * and material density. These values do not establish installation safety.
 */
export function calculateNominalVolumes(
  input: MonumentDimensionsInches,
  profile: MonumentProfile,
): NominalVolumes {
  const dimensions = assertValidDimensions(input);
  const tabletAreaIn2 = getTabletProfileAreaIn2(dimensions, profile);
  const tabletVolumeIn3 = tabletAreaIn2 * dimensions.tablet.thickness;
  const baseVolumeIn3 =
    dimensions.base.width * dimensions.base.height * dimensions.base.depth;
  const totalVolumeIn3 = tabletVolumeIn3 + baseVolumeIn3;
  return {
    tabletAreaIn2,
    tabletVolumeIn3,
    baseVolumeIn3,
    totalVolumeIn3,
    tabletVolumeFt3: cubicInchesToCubicFeet(tabletVolumeIn3),
    baseVolumeFt3: cubicInchesToCubicFeet(baseVolumeIn3),
    totalVolumeFt3: cubicInchesToCubicFeet(totalVolumeIn3),
  };
}
