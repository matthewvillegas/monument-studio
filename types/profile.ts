import type { RectInches, StraightTopUprightGeometry } from "@/types/design";

/** A front face extruded uniformly through the tablet thickness. */
export type MonumentProfile =
  | { kind: "upright-straight" }
  | { kind: "upright-oval"; capRiseIn: number };

export type MonumentGeometry = Omit<StraightTopUprightGeometry, "kind"> & {
  kind: MonumentProfile["kind"];
  profile: MonumentProfile;
};

/** Renderer-neutral boundary of the axis-aligned square-clearance guide. */
export type LayoutGuide =
  | { kind: "empty" }
  | { kind: "rectangle"; rect: RectInches }
  | {
      kind: "oval";
      leftIn: number;
      rightIn: number;
      bottomIn: number;
      edgeYIn: number;
      centerXIn: number;
      topYIn: number;
      radiusXIn: number;
      radiusYIn: number;
    };
