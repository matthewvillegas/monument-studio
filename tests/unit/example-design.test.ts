import { describe, expect, it } from "vitest";
import example from "@/examples/oval-memorial.design.json";
import { designDocumentSchema } from "@/lib/persistence/document";
import { createMonumentGeometry } from "@/lib/geometry/profiles";
import { calculateNominalVolumes } from "@/lib/engineering/volumes";

describe("bundled example design", () => {
  it("is a valid v1 document with independently derived quantities and unchanged round-trip geometry", () => {
    const original = designDocumentSchema.parse(example);
    const restored = designDocumentSchema.parse(
      JSON.parse(JSON.stringify(original)),
    );
    expect(restored).toEqual(original);
    expect(createMonumentGeometry(restored.dimensions, restored.profile)).toEqual(
      createMonumentGeometry(original.dimensions, original.profile),
    );
    const volumes = calculateNominalVolumes(restored.dimensions, restored.profile);
    // 48 × 22 rectangle + half ellipse with semiaxes 24 and 8.
    expect(volumes.tabletAreaIn2).toBeCloseTo(1056 + 96 * Math.PI, 10);
    expect(volumes.tabletVolumeIn3).toBeCloseTo(8448 + 768 * Math.PI, 10);
    expect(volumes.baseVolumeIn3).toBe(6720);
    expect(volumes.totalVolumeIn3).toBeCloseTo(15168 + 768 * Math.PI, 10);
    expect(volumes.totalVolumeFt3).toBeCloseTo((15168 + 768 * Math.PI) / 1728, 12);
  });
});
