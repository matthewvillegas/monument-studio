import { describe, expect, it } from "vitest";
import { createDesignerState, designerReducer } from "@/lib/designer/state";
import { validateDesignerDraft } from "@/lib/designer/draft";
import { calculateNominalVolumes } from "@/lib/engineering/volumes";

describe("joint dimension/profile state", () => {
  it("keeps the entire solid unchanged until all draft fields recover", () => {
    const initial = designerReducer(createDesignerState(), {
      type: "profile",
      kind: "upright-oval",
    });
    let state = designerReducer(initial, { type: "cap-rise", value: "31" });
    state = designerReducer(state, {
      type: "dimension",
      field: "tablet.width",
      value: "56.125",
    });
    expect(state.dimensions).toEqual(initial.dimensions);
    expect(state.profile).toEqual(initial.profile);
    expect(state.draft["tablet.width"]).toBe("56.125");
    expect(calculateNominalVolumes(state.dimensions, state.profile)).toEqual(
      calculateNominalVolumes(initial.dimensions, initial.profile),
    );
    state = designerReducer(state, {
      type: "dimension",
      field: "tablet.height",
      value: "31.125",
    });
    expect(state.dimensions.tablet).toMatchObject({
      width: 56.125,
      height: 31.125,
    });
    expect(state.profile).toEqual({ kind: "upright-oval", capRiseIn: 31 });
    expect(state.inscriptions).toEqual(initial.inscriptions);
  });

  it("never clamps a cap when a smaller height makes it invalid", () => {
    let state = designerReducer(createDesignerState(), {
      type: "profile",
      kind: "upright-oval",
    });
    state = designerReducer(state, { type: "cap-rise", value: "28" });
    const valid = state;
    state = designerReducer(state, {
      type: "dimension",
      field: "tablet.height",
      value: "24",
    });
    expect(state.dimensions).toEqual(valid.dimensions);
    expect(state.profile).toEqual(valid.profile);
    expect(state.capRiseDraft).toBe("28");
    expect(
      validateDesignerDraft(state.draft, state.profileKind, state.capRiseDraft)
        .success,
    ).toBe(false);
    state = designerReducer(state, { type: "cap-rise", value: "24" });
    expect(state.dimensions.tablet.height).toBe(24);
    expect(state.profile).toEqual({ kind: "upright-oval", capRiseIn: 24 });
  });

  it("validates only the active profile while preserving an invalid cap draft", () => {
    let state = designerReducer(createDesignerState(), {
      type: "profile",
      kind: "upright-oval",
    });
    state = designerReducer(state, { type: "cap-rise", value: "" });
    state = designerReducer(state, {
      type: "profile",
      kind: "upright-straight",
    });
    expect(state.profile).toEqual({ kind: "upright-straight" });
    expect(state.capRiseDraft).toBe("");
    expect(
      validateDesignerDraft(state.draft, state.profileKind, state.capRiseDraft)
        .success,
    ).toBe(true);
    state = designerReducer(state, { type: "profile", kind: "upright-oval" });
    expect(state.profileKind).toBe("upright-oval");
    expect(state.profile).toEqual({ kind: "upright-straight" });
    expect(
      validateDesignerDraft(state.draft, state.profileKind, state.capRiseDraft)
        .success,
    ).toBe(false);
  });

  it("rejects missing, nonfinite, zero, and negative cap drafts without corrupting the solid", () => {
    const initial = designerReducer(createDesignerState(), {
      type: "profile",
      kind: "upright-oval",
    });
    for (const value of ["", " ", "NaN", "Infinity", "-Infinity", "0", "-1"]) {
      const state = designerReducer(initial, { type: "cap-rise", value });
      expect(state.profile).toEqual(initial.profile);
      expect(state.dimensions).toEqual(initial.dimensions);
      expect(
        validateDesignerDraft(
          state.draft,
          state.profileKind,
          state.capRiseDraft,
        ).success,
      ).toBe(false);
    }
  });

  it("restores valid default dimensions and rise without changing chosen shape or inscriptions", () => {
    let state = designerReducer(createDesignerState(), {
      type: "profile",
      kind: "upright-oval",
    });
    state = designerReducer(state, {
      type: "inscription",
      id: "name",
      patch: { content: "EXAMPLE", xIn: 18.25 },
    });
    state = designerReducer(state, { type: "cap-rise", value: "200" });
    const reset = designerReducer(state, { type: "reset-dimensions" });
    expect(reset.profile).toEqual({ kind: "upright-oval", capRiseIn: 8 });
    expect(reset.profileKind).toBe("upright-oval");
    expect(reset.capRiseDraft).toBe("8");
    expect(reset.dimensions).toEqual(createDesignerState().dimensions);
    expect(reset.inscriptions).toEqual(state.inscriptions);
    expect(
      validateDesignerDraft(reset.draft, reset.profileKind, reset.capRiseDraft)
        .success,
    ).toBe(true);
  });

  it("centers only the selected line against the last valid width, leaving content and other properties intact", () => {
    let state = designerReducer(createDesignerState(), {
      type: "dimension",
      field: "tablet.width",
      value: "56.125",
    });
    state = designerReducer(state, {
      type: "dimension",
      field: "tablet.width",
      value: "121",
    });
    const before = state.inscriptions;
    state = designerReducer(state, { type: "center-horizontal", id: "name" });
    expect(state.inscriptions[0]).toEqual({ ...before[0], xIn: 28.0625 });
    expect(state.inscriptions.slice(1)).toEqual(before.slice(1));
    expect(state.draft["tablet.width"]).toBe("121");
  });
});
