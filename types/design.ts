export const DESIGN_SCHEMA_VERSION = 1 as const;

export type UnitSystem = "in";
export type MonumentTemplateId = "upright-straight";

export interface TabletDimensionsInches {
  width: number;
  height: number;
  thickness: number;
}

export interface BaseDimensionsInches {
  width: number;
  height: number;
  depth: number;
}

export interface MonumentDimensionsInches {
  tablet: TabletDimensionsInches;
  base: BaseDimensionsInches;
}

export interface MonumentDesignV1 {
  schemaVersion: typeof DESIGN_SCHEMA_VERSION;
  units: UnitSystem;
  templateId: MonumentTemplateId;
  dimensions: MonumentDimensionsInches;
}

export interface SizeInches {
  width: number;
  height: number;
}

export interface PointInches {
  x: number;
  y: number;
}

export interface RectInches extends PointInches, SizeInches {}

export interface ProfileInches {
  units: UnitSystem;
  bounds: SizeInches;
  tablet: RectInches;
  base: RectInches;
}

export interface StraightTopUprightGeometry {
  kind: MonumentTemplateId;
  dimensions: MonumentDimensionsInches;
  overall: {
    width: number;
    height: number;
    depth: number;
  };
  front: ProfileInches;
  side: ProfileInches;
}

export type DimensionFieldPath =
  | "tablet.width"
  | "tablet.height"
  | "tablet.thickness"
  | "base.width"
  | "base.height"
  | "base.depth";

export type DimensionDraft = Record<DimensionFieldPath, string>;
