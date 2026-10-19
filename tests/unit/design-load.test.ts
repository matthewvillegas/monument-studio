import { describe, expect, it } from "vitest";
import { createDesignerState, designerReducer } from "@/lib/designer/state";
import { validateDesignerDraft } from "@/lib/designer/draft";
import { createMonumentGeometry } from "@/lib/geometry/profiles";
import { calculateNominalVolumes } from "@/lib/engineering/volumes";
import {
  createDesignDocument,
  parseDesignFile,
  serializeDesignDocument,
} from "@/lib/persistence/document";
import type { MonumentProfile } from "@/types/profile";

describe("atomic document restoration", () => {
  it.each<MonumentProfile>([
    { kind: "upright-straight" },
    { kind: "upright-oval", capRiseIn: 9.125 },
  ])(
    "reconstructs $kind geometry, quantities and literal inscription coordinates",
    (profile) => {
      const original = createDesignerState();
      const dimensions = {
        tablet: { width: 42.125, height: 30.25, thickness: 8.5 },
        base: { width: 60.625, height: 6.125, depth: 16.75 },
      };
      const document = createDesignDocument({
        dimensions,
        profile,
        inscriptions: original.inscriptions.map((line) => ({
          ...line,
          xIn: 21.0625,
          yIn: line.yIn + 0.125,
          fontSizeIn: 1.375,
        })),
      });
      const parsed = parseDesignFile(serializeDesignDocument(document));
      expect(parsed.success).toBe(true);
      if (!parsed.success) throw new Error("Expected valid round-trip");
      let draft = designerReducer(original, {
        type: "dimension",
        field: "tablet.width",
        value: "",
      });
      draft = designerReducer(draft, {
        type: "inscription-draft",
        id: "epitaph",
        property: "xIn",
        value: "999",
      });
      draft = designerReducer(draft, { type: "select", id: "epitaph" });
      const restored = designerReducer(draft, {
        type: "load-document",
        document: parsed.document,
      });
      expect(restored.dimensions).toEqual(dimensions);
      expect(restored.profile).toEqual(profile);
      expect(restored.profileKind).toBe(profile.kind);
      expect(restored.inscriptions).toEqual(document.inscriptions);
      expect(restored.selectedId).toBe("name");
      expect(restored.inscriptionDrafts).toEqual({});
      expect(restored.message).toBe("");
      expect(restored.draft["tablet.width"]).toBe("42.125");
      expect(restored.capRiseDraft).toBe(
        profile.kind === "upright-oval" ? "9.125" : "8",
      );
      expect(
        validateDesignerDraft(
          restored.draft,
          restored.profileKind,
          restored.capRiseDraft,
        ).success,
      ).toBe(true);
      expect(
        createMonumentGeometry(restored.dimensions, restored.profile),
      ).toEqual(createMonumentGeometry(dimensions, profile));
      expect(
        calculateNominalVolumes(restored.dimensions, restored.profile),
      ).toEqual(calculateNominalVolumes(dimensions, profile));
    },
  );

  it("leaves every part of the working state unchanged on a rejected load", () => {
    let state = designerReducer(createDesignerState(), {
      type: "inscription",
      id: "name",
      patch: { content: "KEEP THIS WORK" },
    });
    state = designerReducer(state, {
      type: "dimension",
      field: "tablet.height",
      value: "",
    });
    const valid = createDesignDocument(state);
    for (const document of [
      null,
      {},
      { ...valid, schemaVersion: 2 },
      { ...valid, totalVolumeIn3: 100 },
      { ...valid, inscriptions: [] },
      {
        ...valid,
        dimensions: {
          ...valid.dimensions,
          tablet: { ...valid.dimensions.tablet, width: 999 },
        },
      },
    ]) {
      expect(designerReducer(state, { type: "load-document", document })).toBe(
        state,
      );
    }
  });
});

describe("unapplied inscription measurements", () => {
  it("keeps invalid drafts separate from canonical positions across selection changes", () => {
    const initial = createDesignerState();
    let state = designerReducer(initial, {
      type: "inscription-draft",
      id: "name",
      property: "xIn",
      value: "999",
    });
    state = designerReducer(state, { type: "select", id: "dates" });
    expect(state.inscriptionDrafts.name?.xIn).toBe("999");
    expect(state.inscriptions).toEqual(initial.inscriptions);
    expect(createDesignDocument(state)).toEqual(createDesignDocument(initial));
    const invalidCommit = designerReducer(state, {
      type: "inscription",
      id: "name",
      patch: { xIn: 999 },
    });
    expect(invalidCommit.inscriptions).toEqual(initial.inscriptions);
    expect(invalidCommit.inscriptionDrafts).toEqual(state.inscriptionDrafts);
  });

  it("clears only applied fields and retains other unfinished measurements", () => {
    let state = createDesignerState();
    for (const property of ["xIn", "yIn", "fontSizeIn"] as const) {
      state = designerReducer(state, {
        type: "inscription-draft",
        id: "name",
        property,
        value: "",
      });
    }
    state = designerReducer(state, { type: "center-horizontal", id: "name" });
    expect(state.inscriptionDrafts.name).toEqual({ yIn: "", fontSizeIn: "" });
    state = designerReducer(state, {
      type: "inscription",
      id: "name",
      patch: { yIn: 12.125 },
    });
    expect(state.inscriptionDrafts.name).toEqual({ fontSizeIn: "" });
    state = designerReducer(state, {
      type: "inscription",
      id: "name",
      patch: { content: "EXAMPLE" },
    });
    expect(state.inscriptionDrafts.name).toEqual({ fontSizeIn: "" });
    state = designerReducer(state, { type: "reset-position", id: "name" });
    expect(state.inscriptionDrafts.name).toEqual({});
    expect(state.inscriptions[0]?.content).toBe("EXAMPLE");
  });
});
