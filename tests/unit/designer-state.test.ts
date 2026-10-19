import { describe, expect, it } from "vitest";

import { DEMO_DESIGN, createDimensionDraft } from "@/data/mock-designer";
import {
  createDesignerState,
  designerReducer,
  type DesignerAction,
  type DesignerState,
} from "@/lib/designer/state";
import { createStraightTopUprightGeometry } from "@/lib/geometry/straight-top";
import type { InscriptionElement, InscriptionId } from "@/types/inscription";

function findInscription(
  state: DesignerState,
  id: InscriptionId,
): InscriptionElement {
  const element = state.inscriptions.find((item) => item.id === id);
  expect(element).toBeDefined();
  return element as InscriptionElement;
}

function reduce(
  state: DesignerState,
  ...actions: DesignerAction[]
): DesignerState {
  return actions.reduce(designerReducer, state);
}

describe("designer state dimension integration", () => {
  it("derives valid initial straight-top geometry", () => {
    const state = createDesignerState();
    const geometry = createStraightTopUprightGeometry(state.dimensions);

    expect(state.draft).toEqual(createDimensionDraft());
    expect(geometry.overall).toEqual({ width: 60, height: 38, depth: 14 });
    expect(geometry.front.tablet.width).toBe(48);
    expect(geometry.side.tablet.width).toBe(8);
  });

  it("preserves the last valid model through alternating invalid and valid drafts", () => {
    const initial = createDesignerState();
    const invalidWidth = designerReducer(initial, {
      type: "dimension",
      field: "tablet.width",
      value: "70",
    });

    expect(invalidWidth.draft["tablet.width"]).toBe("70");
    expect(invalidWidth.dimensions).toEqual(initial.dimensions);
    expect(
      createStraightTopUprightGeometry(invalidWidth.dimensions).overall,
    ).toEqual({ width: 60, height: 38, depth: 14 });

    const stillInvalid = designerReducer(invalidWidth, {
      type: "dimension",
      field: "tablet.height",
      value: "31.5",
    });
    expect(stillInvalid.draft["tablet.height"]).toBe("31.5");
    expect(stillInvalid.dimensions).toEqual(initial.dimensions);

    const valid = designerReducer(stillInvalid, {
      type: "dimension",
      field: "base.width",
      value: "72.25",
    });
    expect(valid.dimensions.tablet).toEqual({
      width: 70,
      height: 31.5,
      thickness: 8,
    });
    expect(valid.dimensions.base.width).toBe(72.25);
    expect(createStraightTopUprightGeometry(valid.dimensions).overall).toEqual({
      width: 72.25,
      height: 39.5,
      depth: 14,
    });

    const invalidAgain = designerReducer(valid, {
      type: "dimension",
      field: "base.depth",
      value: "7.99",
    });
    expect(invalidAgain.draft["base.depth"]).toBe("7.99");
    expect(invalidAgain.dimensions).toEqual(valid.dimensions);

    const validAgain = designerReducer(invalidAgain, {
      type: "dimension",
      field: "base.depth",
      value: "10.125",
    });
    expect(validAgain.dimensions.base.depth).toBe(10.125);
    expect(
      createStraightTopUprightGeometry(validAgain.dimensions).side.bounds.width,
    ).toBe(10.125);
  });

  it("keeps inscription text and inch coordinates unchanged while resizing", () => {
    const edited = reduce(
      createDesignerState(),
      {
        type: "inscription",
        id: "name",
        patch: {
          content: "VILLEGAS",
          xIn: 20.125,
          yIn: 11.875,
          fontSizeIn: 2.75,
        },
      },
      { type: "dimension", field: "tablet.width", value: "52.5" },
      { type: "dimension", field: "tablet.height", value: "36.25" },
    );

    expect(findInscription(edited, "name")).toEqual({
      id: "name",
      content: "VILLEGAS",
      xIn: 20.125,
      yIn: 11.875,
      fontSizeIn: 2.75,
    });
    const geometry = createStraightTopUprightGeometry(edited.dimensions);
    expect(geometry.front.tablet.width).toBe(52.5);
    expect(geometry.front.tablet.height).toBe(36.25);
  });

  it("resets dimensions without discarding edited inscription data", () => {
    const edited = reduce(
      createDesignerState(),
      {
        type: "inscription",
        id: "epitaph",
        patch: {
          content: "FOREVER IN OUR HEARTS",
          xIn: 21.5,
          yIn: 24.25,
          fontSizeIn: 0.875,
        },
      },
      { type: "dimension", field: "tablet.height", value: "42" },
    );
    const inscriptionBeforeReset = findInscription(edited, "epitaph");

    const reset = designerReducer(edited, { type: "reset-dimensions" });

    expect(reset.dimensions).toEqual(DEMO_DESIGN.dimensions);
    expect(reset.draft).toEqual(createDimensionDraft());
    expect(findInscription(reset, "epitaph")).toEqual(
      inscriptionBeforeReset,
    );
  });
});

describe("designer state inscription integrity", () => {
  it("accepts finite fractional updates and rejects non-finite updates", () => {
    const initial = createDesignerState();
    const valid = designerReducer(initial, {
      type: "inscription",
      id: "dates",
      patch: { xIn: 23.125, yIn: 17.625, fontSizeIn: 1.375 },
    });
    expect(findInscription(valid, "dates")).toMatchObject({
      xIn: 23.125,
      yIn: 17.625,
      fontSizeIn: 1.375,
    });
    expect(valid.message).toBe("");

    const invalid = designerReducer(valid, {
      type: "inscription",
      id: "dates",
      patch: { xIn: Number.POSITIVE_INFINITY },
    });
    expect(findInscription(invalid, "dates")).toEqual(
      findInscription(valid, "dates"),
    );
    expect(invalid.message).not.toBe("");
  });

  it("keeps an inscription identifier immutable for runtime patch payloads", () => {
    const initial = createDesignerState();
    const runtimeAction = {
      type: "inscription",
      id: "name",
      patch: { id: "dates", content: "RUNTIME INPUT" },
    } as unknown as DesignerAction;

    const updated = designerReducer(initial, runtimeAction);

    expect(updated.inscriptions.map((item) => item.id)).toEqual([
      "name",
      "dates",
      "epitaph",
    ]);
    expect(findInscription(updated, "name").content).toBe("RUNTIME INPUT");
  });

  it("keeps repeated keyboard nudges stable and rejects non-finite deltas", () => {
    const initial = createDesignerState();
    let state = initial;

    for (let step = 0; step < 100; step += 1) {
      state = designerReducer(state, {
        type: "nudge",
        id: "name",
        dx: 0.1,
        dy: -0.1,
      });
    }
    expect(findInscription(state, "name")).toMatchObject({
      xIn: 34,
      yIn: 2,
    });

    for (let step = 0; step < 100; step += 1) {
      state = designerReducer(state, {
        type: "nudge",
        id: "name",
        dx: -0.1,
        dy: 0.1,
      });
    }
    expect(findInscription(state, "name")).toMatchObject({
      xIn: 24,
      yIn: 12,
    });

    const beforeInvalidNudge = findInscription(state, "name");
    const invalid = designerReducer(state, {
      type: "nudge",
      id: "name",
      dx: Number.NaN,
      dy: Number.POSITIVE_INFINITY,
    });
    expect(findInscription(invalid, "name")).toEqual(beforeInvalidNudge);
    expect(invalid.message).not.toBe("");
    expect(designerReducer(invalid, {
      type: "dimension", field: "tablet.width", value: "52",
    }).message).toBe("");
    expect(designerReducer(invalid, { type: "reset-dimensions" }).message).toBe("");
    expect(designerReducer(invalid, { type: "select", id: "name" }).message).toBe("");
  });

  it("resets position for the current tablet while preserving content", () => {
    const edited = reduce(
      createDesignerState(),
      { type: "dimension", field: "tablet.width", value: "54" },
      { type: "dimension", field: "tablet.height", value: "40" },
      {
        type: "inscription",
        id: "name",
        patch: {
          content: "VILLEGAS",
          xIn: 8.75,
          yIn: 7.25,
          fontSizeIn: 4,
        },
      },
    );

    const reset = designerReducer(edited, {
      type: "reset-position",
      id: "name",
    });

    expect(findInscription(reset, "name")).toEqual({
      id: "name",
      content: "VILLEGAS",
      xIn: 27,
      yIn: 16,
      fontSizeIn: 2.5,
    });
  });
});
