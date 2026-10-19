import { describe, expect, it } from "vitest";

import { createDesignerState } from "@/lib/designer/state";
import { calculateNominalVolumes } from "@/lib/engineering/volumes";
import { createMonumentGeometry } from "@/lib/geometry/profiles";
import { checkInscriptionLayout } from "@/lib/inscriptions/layout";
import {
  createDesignDocument,
  designDocumentSchema,
  MAX_DESIGN_FILE_BYTES,
  parseDesignFile,
  serializeDesignDocument,
  type DesignDocument,
} from "@/lib/persistence/document";
import type { MonumentProfile } from "@/types/profile";

function example(profile: MonumentProfile = { kind: "upright-straight" }) {
  return createDesignDocument({ ...createDesignerState(), profile });
}

function parseSuccessfully(input: string): DesignDocument {
  const result = parseDesignFile(input);
  expect(result.success).toBe(true);
  if (!result.success) throw new Error(result.code);
  return result.document;
}

describe("versioned canonical design documents", () => {
  it.each<MonumentProfile>([
    { kind: "upright-straight" },
    { kind: "upright-oval", capRiseIn: 8.125 },
  ])(
    "round-trips all canonical choices and derived geometry for $kind",
    (profile) => {
      const original = example(profile);
      original.dimensions = {
        tablet: { width: 48.125, height: 30.75, thickness: 8.375 },
        base: { width: 60.25, height: 8.5, depth: 14.625 },
      };
      original.inscriptions[0] = {
        id: "name",
        content: "  VILLEGAS · ÁLVAREZ  ",
        xIn: 24.0625,
        yIn: 11.987654321,
        fontSizeIn: 2.375,
      };
      original.inscriptions[1] = {
        id: "dates",
        content: "19XX — 20XX",
        xIn: 22.625,
        yIn: 17.333333333,
        fontSizeIn: 1.125,
      };
      original.inscriptions[2] = {
        id: "epitaph",
        content: "Forever in our hearts",
        xIn: 23.25,
        yIn: 24.0625,
        fontSizeIn: 0.875,
      };
      const restored = parseSuccessfully(serializeDesignDocument(original));
      expect(restored).toEqual(original);
      expect(restored).not.toBe(original);
      expect(
        createMonumentGeometry(restored.dimensions, restored.profile),
      ).toEqual(createMonumentGeometry(original.dimensions, original.profile));
      expect(
        calculateNominalVolumes(restored.dimensions, restored.profile),
      ).toEqual(calculateNominalVolumes(original.dimensions, original.profile));
    },
  );

  it("recomputes reference quantities rather than trusting stored results", () => {
    const straight = parseSuccessfully(serializeDesignDocument(example()));
    const oval = parseSuccessfully(
      serializeDesignDocument(example({ kind: "upright-oval", capRiseIn: 8 })),
    );
    const straightVolumes = calculateNominalVolumes(
      straight.dimensions,
      straight.profile,
    );
    const ovalVolumes = calculateNominalVolumes(oval.dimensions, oval.profile);
    expect(straightVolumes.tabletAreaIn2).toBe(1440);
    expect(straightVolumes.totalVolumeIn3).toBe(18240);
    expect(ovalVolumes.tabletAreaIn2).toBeCloseTo(1357.59289474462, 10);
    expect(ovalVolumes.totalVolumeIn3).toBeCloseTo(17580.74315795696, 9);
    expect(ovalVolumes.totalVolumeFt3).toBeCloseTo(10.17404117937324, 12);
    expect(
      parseDesignFile(JSON.stringify({ ...oval, totalVolumeIn3: 1 })),
    ).toEqual({ success: false, code: "invalid" });
  });

  it("persists only canonical state and leaves the original state untouched", () => {
    const state = createDesignerState();
    state.draft["tablet.width"] = "invalid unfinished text";
    state.selectedId = "epitaph";
    state.message = "A temporary warning";
    const snapshot = structuredClone(state);
    const document = createDesignDocument(state);
    expect(Object.keys(document)).toEqual([
      "format",
      "schemaVersion",
      "units",
      "profile",
      "dimensions",
      "inscriptions",
    ]);
    expect(document.dimensions.tablet.width).toBe(48);
    expect(document.inscriptions).not.toBe(state.inscriptions);
    expect(document.dimensions).not.toBe(state.dimensions);
    expect(state).toEqual(snapshot);
  });

  it("normalizes field and inscription order without rounding or rewriting content", () => {
    const original = example({ kind: "upright-oval", capRiseIn: 0.0000001 });
    const reordered = {
      inscriptions: [...original.inscriptions].reverse(),
      dimensions: {
        base: original.dimensions.base,
        tablet: original.dimensions.tablet,
      },
      profile: { capRiseIn: 0.0000001, kind: "upright-oval" },
      units: "in",
      schemaVersion: 1,
      format: "monumentstudio-design",
    };
    expect(serializeDesignDocument(reordered)).toBe(
      serializeDesignDocument(original),
    );
    expect(parseSuccessfully(JSON.stringify(reordered))).toEqual(original);
  });

  it("preserves blank lines and out-of-face positions as editable layout warnings", () => {
    const original = example({ kind: "upright-oval", capRiseIn: 30 });
    original.inscriptions[0]!.xIn = -12.125;
    original.inscriptions[0]!.yIn = -0.5;
    original.inscriptions[1]!.content = "";
    const restored = parseSuccessfully(serializeDesignDocument(original));
    const bounds = { name: { x: -14, y: -2, width: 4, height: 2 } };
    const warnings = checkInscriptionLayout(
      restored.inscriptions,
      bounds,
      restored.dimensions.tablet,
      1,
      restored.profile,
    );
    expect(restored.inscriptions).toEqual(original.inscriptions);
    expect(warnings.map((warning) => warning.kind)).toEqual([
      "outside-face",
      "margin",
      "empty",
    ]);
    expect(warnings).toEqual(
      checkInscriptionLayout(
        original.inscriptions,
        bounds,
        original.dimensions.tablet,
        1,
        original.profile,
      ),
    );
  });

  it("treats markup as literal inscription content, never document structure", () => {
    const original = example();
    original.inscriptions[0]!.content = '<img src=x onerror="alert(1)">';
    expect(
      parseSuccessfully(serializeDesignDocument(original)).inscriptions[0]!
        .content,
    ).toBe(original.inscriptions[0]!.content);
  });

  it("rejects unsupported versions separately from malformed schema identifiers", () => {
    for (const version of [0, 2, 999]) {
      expect(
        parseDesignFile(
          JSON.stringify({ ...example(), schemaVersion: version }),
        ),
      ).toEqual({ success: false, code: "unsupported" });
    }
    for (const version of ["1", null, 1.5]) {
      expect(
        parseDesignFile(
          JSON.stringify({ ...example(), schemaVersion: version }),
        ),
      ).toEqual({ success: false, code: "invalid" });
    }
  });

  it("rejects the old illustrative dimension-only V1 instead of guessing a migration", () => {
    const { dimensions } = example();
    expect(
      parseDesignFile(
        JSON.stringify({
          schemaVersion: 1,
          units: "in",
          templateId: "upright-straight",
          dimensions,
        }),
      ),
    ).toEqual({ success: false, code: "invalid" });
  });

  it("rejects corrupt JSON and valid JSON with a non-document root", () => {
    for (const text of ["", "{", '{"schemaVersion":1,}', "not JSON"]) {
      expect(parseDesignFile(text)).toEqual({
        success: false,
        code: "corrupt",
      });
    }
    for (const text of ["null", "[]", "true", "123", '"document"']) {
      expect(parseDesignFile(text)).toEqual({
        success: false,
        code: "invalid",
      });
    }
  });

  it("requires every document field and all three unique inscription elements", () => {
    for (const key of Object.keys(example())) {
      const incomplete = { ...example() } as Record<string, unknown>;
      delete incomplete[key];
      expect(parseDesignFile(JSON.stringify(incomplete))).toEqual({
        success: false,
        code: "invalid",
      });
    }
    for (const inscriptions of [
      [],
      example().inscriptions.slice(0, 2),
      [
        example().inscriptions[0],
        example().inscriptions[0],
        example().inscriptions[2],
      ],
    ]) {
      expect(
        parseDesignFile(JSON.stringify({ ...example(), inscriptions })),
      ).toEqual({ success: false, code: "invalid" });
    }
  });

  it("rejects unknown properties at every object boundary", () => {
    const cases: unknown[] = [];
    const root = example();
    cases.push({ ...root, selection: "name" });
    cases.push({ ...root, profile: { ...root.profile, capRiseIn: 8 } });
    cases.push({ ...root, dimensions: { ...root.dimensions, pixels: 700 } });
    cases.push({
      ...root,
      dimensions: {
        ...root.dimensions,
        tablet: { ...root.dimensions.tablet, x: 0 },
      },
    });
    cases.push({
      ...root,
      dimensions: {
        ...root.dimensions,
        base: { ...root.dimensions.base, area: 1 },
      },
    });
    cases.push({
      ...root,
      inscriptions: root.inscriptions.map((item) => ({
        ...item,
        textAnchor: "left",
      })),
    });
    for (const value of cases) {
      expect(parseDesignFile(JSON.stringify(value))).toEqual({
        success: false,
        code: "invalid",
      });
    }
  });

  it("rejects prototype-sensitive JSON keys without mutating any object prototype", () => {
    const base = JSON.stringify(example());
    const payloads = [
      base.replace('{"format"', '{"__proto__":{"polluted":true},"format"'),
      base.replace(
        '"tablet":{',
        '"tablet":{"constructor":{"prototype":{"polluted":true}},',
      ),
      base.replace('"id":"name"', '"__proto__":{"polluted":true},"id":"name"'),
      base.replace(
        '"kind":"upright-straight"',
        '"kind":"upright-straight","prototype":{"polluted":true}',
      ),
    ];
    for (const text of payloads) {
      expect(parseDesignFile(text)).toEqual({
        success: false,
        code: "invalid",
      });
      expect(designDocumentSchema.safeParse(JSON.parse(text)).success).toBe(
        false,
      );
    }
    expect("polluted" in {}).toBe(false);
    expect(Object.prototype).not.toHaveProperty("polluted");
  });

  it("rejects invalid dimension/profile combinations and nonnumeric dimensions", () => {
    const cases = [
      {
        ...example(),
        dimensions: {
          tablet: { width: 48, height: 30, thickness: 8 },
          base: { width: 47, height: 8, depth: 14 },
        },
      },
      {
        ...example(),
        dimensions: {
          tablet: { width: 48, height: 30, thickness: 8 },
          base: { width: 60, height: 8, depth: 7 },
        },
      },
      {
        ...example(),
        dimensions: {
          tablet: { width: "48", height: 30, thickness: 8 },
          base: example().dimensions.base,
        },
      },
      { ...example(), profile: { kind: "upright-oval", capRiseIn: 30.01 } },
      { ...example(), profile: { kind: "upright-oval", capRiseIn: 0 } },
      { ...example(), profile: { kind: "upright-oval" } },
      { ...example(), profile: { kind: "other" } },
    ];
    for (const value of cases) {
      expect(parseDesignFile(JSON.stringify(value))).toEqual({
        success: false,
        code: "invalid",
      });
    }
  });

  it("rejects deeply nested payloads, cycles, and accessor objects without executing getters", () => {
    const deeplyNested = `{"unexpected":${"[".repeat(10_000)}{"__proto__":true}${"]".repeat(10_000)}}`;
    expect(new TextEncoder().encode(deeplyNested).byteLength).toBeLessThan(
      MAX_DESIGN_FILE_BYTES,
    );
    expect(parseDesignFile(deeplyNested)).toEqual({
      success: false,
      code: "invalid",
    });
    const cyclic: Record<string, unknown> = { ...example() };
    cyclic.self = cyclic;
    expect(designDocumentSchema.safeParse(cyclic).success).toBe(false);
    const accessor = { ...example() };
    Object.defineProperty(accessor, "profile", {
      enumerable: true,
      get() {
        throw new Error("Untrusted getter must not run");
      },
    });
    expect(designDocumentSchema.safeParse(accessor).success).toBe(false);
  });

  it("round-trips supported dimensional extremes including a full-height oval cap", () => {
    const bounds = [
      {
        tablet: { width: 12, height: 12, thickness: 2 },
        base: { width: 12, height: 2, depth: 4 },
      },
      {
        tablet: { width: 120, height: 96, thickness: 24 },
        base: { width: 144, height: 24, depth: 48 },
      },
    ];
    for (const dimensions of bounds) {
      const document = example();
      document.dimensions = dimensions;
      document.profile = {
        kind: "upright-oval",
        capRiseIn: dimensions.tablet.height,
      };
      document.inscriptions[0]!.xIn = -240;
      document.inscriptions[0]!.yIn = 240;
      document.inscriptions[0]!.fontSizeIn = 0.25;
      document.inscriptions[1]!.fontSizeIn = 12;
      const restored = parseSuccessfully(serializeDesignDocument(document));
      expect(restored).toEqual(document);
      expect(
        calculateNominalVolumes(restored.dimensions, restored.profile),
      ).toEqual(calculateNominalVolumes(document.dimensions, document.profile));
    }
  });

  it("rejects invalid coordinates, font sizes, identifiers, and text without coercion", () => {
    const patches: Record<string, unknown>[] = [
      { xIn: -240.001 },
      { yIn: 240.001 },
      { xIn: "24" },
      { yIn: null },
      { fontSizeIn: 0.249 },
      { fontSizeIn: 12.001 },
      { fontSizeIn: "2.5" },
      { id: "other" },
      { content: "A\nB" },
      { content: "A".repeat(81) },
    ];
    for (const patch of patches) {
      const document = example();
      const input = {
        ...document,
        inscriptions: [
          { ...document.inscriptions[0], ...patch },
          ...document.inscriptions.slice(1),
        ],
      };
      expect(parseDesignFile(JSON.stringify(input))).toEqual({
        success: false,
        code: "invalid",
      });
    }
    for (const value of [NaN, Infinity, -Infinity]) {
      const document = example();
      document.inscriptions[0]!.xIn = value;
      expect(designDocumentSchema.safeParse(document).success).toBe(false);
      expect(() => serializeDesignDocument(document)).toThrow();
    }
  });

  it("bounds file bytes including UTF-8 and accepts the exact size boundary", () => {
    const raw = serializeDesignDocument(example());
    const exactLimit =
      raw +
      " ".repeat(
        MAX_DESIGN_FILE_BYTES - new TextEncoder().encode(raw).byteLength,
      );
    expect(parseDesignFile(exactLimit).success).toBe(true);
    expect(parseDesignFile(exactLimit + " ")).toEqual({
      success: false,
      code: "too-large",
    });
    // Fewer than 65,536 JS code units can still exceed the byte limit.
    const multibyte = `"${"á".repeat(33_000)}"`;
    expect(multibyte.length).toBeLessThan(MAX_DESIGN_FILE_BYTES);
    expect(parseDesignFile(multibyte)).toEqual({
      success: false,
      code: "too-large",
    });
  });
});
