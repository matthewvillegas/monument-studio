import type { DimensionDraft, MonumentDesignV1 } from "@/types/design";

export const DEMO_DESIGN: MonumentDesignV1 = {
  schemaVersion: 1,
  units: "in",
  templateId: "upright-straight",
  dimensions: {
    tablet: {
      width: 48,
      height: 30,
      thickness: 8,
    },
    base: {
      width: 60,
      height: 8,
      depth: 14,
    },
  },
};

export const DEMO_PROJECT = {
  designNumber: "MS-DEMO-001",
  material: {
    name: "Jet Black",
    description: "Demonstration material",
    previewColor: "#242422",
  },
  finish: {
    name: "Polished front",
  },
} as const;

export function createDimensionDraft(
  design: MonumentDesignV1 = DEMO_DESIGN,
): DimensionDraft {
  return {
    "tablet.width": String(design.dimensions.tablet.width),
    "tablet.height": String(design.dimensions.tablet.height),
    "tablet.thickness": String(design.dimensions.tablet.thickness),
    "base.width": String(design.dimensions.base.width),
    "base.height": String(design.dimensions.base.height),
    "base.depth": String(design.dimensions.base.depth),
  };
}
