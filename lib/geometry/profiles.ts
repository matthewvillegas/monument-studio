import { createStraightTopUprightGeometry } from "@/lib/geometry/straight-top";
import { assertValidDimensions } from "@/lib/validation/dimensions";
import { assertValidProfile } from "@/lib/validation/profile";
import type { MonumentDimensionsInches } from "@/types/design";
import type { MonumentGeometry, MonumentProfile } from "@/types/profile";

export function createMonumentGeometry(
  input: MonumentDimensionsInches,
  inputProfile: MonumentProfile,
): MonumentGeometry {
  // A half-ellipse cap has the same bounding envelope and bottom contact as
  // the rectangle. The side orthographic silhouette is T x H: this is a
  // constant-thickness extrusion, not an elliptical side profile.
  const geometry = createStraightTopUprightGeometry(input);
  const profile = assertValidProfile(
    inputProfile,
    geometry.dimensions.tablet.height,
  );
  return { ...geometry, kind: profile.kind, profile };
}

export function getTabletProfileAreaIn2(
  input: MonumentDimensionsInches,
  inputProfile: MonumentProfile,
): number {
  const { tablet } = assertValidDimensions(input);
  const profile = assertValidProfile(inputProfile, tablet.height);
  if (profile.kind === "upright-straight") {
    return tablet.width * tablet.height;
  }

  // Rectangle W(H-R), plus half an ellipse with radii W/2 and R.
  return (
    tablet.width * (tablet.height - profile.capRiseIn) +
    (Math.PI * tablet.width * profile.capRiseIn) / 4
  );
}
