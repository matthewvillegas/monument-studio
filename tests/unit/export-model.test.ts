import { describe, expect, it } from "vitest";

import example from "@/examples/oval-memorial.design.json";
import { prepareExportModel } from "@/lib/exports/model";
import { proposalDetailsSchema } from "@/lib/exports/proposal";

describe("validated export snapshot", () => {
  it("preserves exact decimal inputs and center/baseline coordinates without retaining mutable references", () => {
    const input = structuredClone(example);
    const name = input.inscriptions[0]!;
    input.dimensions.tablet.width = 48.125;
    name.content = "GARCÍA — FAMILY";
    name.xIn = 23.375;
    name.yIn = 12.125;
    name.fontSizeIn = 2.875;
    const snapshot = prepareExportModel(input);
    expect(snapshot.document).toEqual(input);
    expect(snapshot.document).not.toBe(input);
    name.content = "CHANGED";
    input.dimensions.tablet.width = 50;
    expect(snapshot.document.inscriptions[0]!.content).toBe("GARCÍA — FAMILY");
    expect(snapshot.document.dimensions.tablet.width).toBe(48.125);
    expect(snapshot.specificationRows).toContainEqual({ label: "Tablet width", value: "48.125 in" });
  });

  it("reuses the analytic oval model with independent area and volume references", () => {
    const model = prepareExportModel(example);
    expect(model.profileLabel).toBe("Oval-top upright");
    expect(model.volumes.tabletAreaIn2).toBeCloseTo(1056 + 96 * Math.PI, 10);
    expect(model.volumes.totalVolumeIn3).toBeCloseTo(15168 + 768 * Math.PI, 10);
    expect(model.volumes.totalVolumeFt3).toBeCloseTo((15168 + 768 * Math.PI) / 1728, 12);
    expect(model.geometry.overall).toEqual({ width: 60, height: 38, depth: 14 });
    expect(model.specificationRows).toContainEqual({ label: "Oval cap rise", value: "8 in" });
  });

  it("supports straight tops without a cap parameter or derived persisted fields", () => {
    const model = prepareExportModel({ ...example, profile: { kind: "upright-straight" } });
    expect(model.profileLabel).toBe("Straight-top upright");
    expect(model.volumes.tabletAreaIn2).toBe(1440);
    expect(model.volumes.totalVolumeIn3).toBe(18240);
    expect(model.specificationRows.some((row) => row.label === "Oval cap rise")).toBe(false);
    expect(Object.keys(model.document).sort()).toEqual(["dimensions", "format", "inscriptions", "profile", "schemaVersion", "units"]);
  });

  it.each([
    { ...example, schemaVersion: 2 },
    { ...example, volumes: { totalVolumeIn3: 0 } },
    { ...example, profile: { kind: "upright-oval", capRiseIn: 31 } },
    { ...example, dimensions: { ...example.dimensions, base: { ...example.dimensions.base, width: 20 } } },
    { ...example, inscriptions: [{ ...example.inscriptions[0], fontSizeIn: Infinity }, ...example.inscriptions.slice(1)] },
  ])("rejects malformed or invalid canonical input", (input) => {
    expect(() => prepareExportModel(input)).toThrow();
  });
});

describe("ephemeral proposal details", () => {
  it("allows empty optional fields and literal text without HTML execution or design schema changes", () => {
    expect(proposalDetailsSchema.parse({})).toEqual({});
    const input = { familyReference: "García family", description: "First line\nSecond line", notes: "<script>literal text</script>" };
    expect(proposalDetailsSchema.parse(input)).toEqual(input);
    expect(example).not.toHaveProperty("proposal");
  });

  it.each([
    { familyReference: "x".repeat(121) },
    { title: "x".repeat(121) },
    { projectReference: "x".repeat(81) },
    { description: "x".repeat(1201) },
    { notes: "x".repeat(3001) },
    { notes: "hidden\u0000control" },
    { title: "Two\nlines" },
    { email: "not-collected@example.invalid" },
    JSON.parse('{"__proto__":{"polluted":true}}'),
  ])("rejects oversized, unexpected or control-character proposal fields", (input) => {
    expect(proposalDetailsSchema.safeParse(input).success).toBe(false);
  });

  it("rejects an accessor without invoking it", () => {
    let called = false;
    const input = Object.defineProperty({}, "title", { enumerable: true, get: () => { called = true; return "unsafe"; } });
    expect(proposalDetailsSchema.safeParse(input).success).toBe(false);
    expect(called).toBe(false);
  });
});
