import { createDimensionDraft, DEMO_DESIGN } from "@/data/mock-designer";
import {
  createDefaultInscriptionElements,
  moveInscription,
} from "@/lib/inscriptions/layout";
import { validateDesignerDraft } from "@/lib/designer/draft";
import { inscriptionElementSchema } from "@/lib/validation/inscriptions";
import type {
  DimensionDraft,
  DimensionFieldPath,
  MonumentDimensionsInches,
} from "@/types/design";
import type {
  InscriptionDrafts,
  InscriptionElement,
  InscriptionId,
  InscriptionNumericProperty,
} from "@/types/inscription";
import type { MonumentProfile } from "@/types/profile";
import { designDocumentSchema } from "@/lib/persistence/document";

export interface DesignerState {
  draft: DimensionDraft;
  dimensions: MonumentDimensionsInches;
  inscriptions: InscriptionElement[];
  selectedId: InscriptionId;
  message: string;
  profile: MonumentProfile;
  profileKind: MonumentProfile["kind"];
  capRiseDraft: string;
  inscriptionDrafts: InscriptionDrafts;
}

export type DesignerAction =
  | { type: "load-document"; document: unknown }
  | {
      type: "inscription-draft";
      id: InscriptionId;
      property: InscriptionNumericProperty;
      value: string;
    }
  | { type: "dimension"; field: DimensionFieldPath; value: string }
  | { type: "reset-dimensions" }
  | { type: "profile"; kind: MonumentProfile["kind"] }
  | { type: "cap-rise"; value: string }
  | { type: "center-horizontal"; id: InscriptionId }
  | { type: "select"; id: InscriptionId }
  | {
      type: "inscription";
      id: InscriptionId;
      patch: Partial<Omit<InscriptionElement, "id">>;
    }
  | { type: "nudge"; id: InscriptionId; dx: number; dy: number }
  | { type: "reset-position"; id: InscriptionId };

export function createDesignerState(): DesignerState {
  return {
    draft: createDimensionDraft(),
    dimensions: DEMO_DESIGN.dimensions,
    inscriptions: createDefaultInscriptionElements(
      DEMO_DESIGN.dimensions.tablet,
    ),
    selectedId: "name",
    message: "",
    profile: { kind: "upright-straight" },
    profileKind: "upright-straight",
    capRiseDraft: "8",
    inscriptionDrafts: {},
  };
}

/** Invalid dimension drafts never replace the last valid, inch-based model. */
export function designerReducer(
  state: DesignerState,
  action: DesignerAction,
): DesignerState {
  if (action.type === "load-document") {
    const result = designDocumentSchema.safeParse(action.document);
    // Imported documents cross an untrusted boundary, even if a UI caller validated them.
    if (!result.success) return state;
    const document = result.data;
    return {
      ...createDesignerState(),
      dimensions: document.dimensions,
      profile: document.profile,
      profileKind: document.profile.kind,
      capRiseDraft:
        document.profile.kind === "upright-oval"
          ? String(document.profile.capRiseIn)
          : "8",
      draft: createDimensionDraft({
        ...DEMO_DESIGN,
        dimensions: document.dimensions,
      }),
      inscriptions: document.inscriptions,
    };
  }
  if (action.type === "inscription-draft") {
    return {
      ...state,
      inscriptionDrafts: {
        ...state.inscriptionDrafts,
        [action.id]: {
          ...state.inscriptionDrafts[action.id],
          [action.property]: action.value,
        },
      },
    };
  }
  if (
    action.type === "dimension" ||
    action.type === "profile" ||
    action.type === "cap-rise"
  ) {
    const draft =
      action.type === "dimension"
        ? { ...state.draft, [action.field]: action.value }
        : state.draft;
    const profileKind =
      action.type === "profile" ? action.kind : state.profileKind;
    const capRiseDraft =
      action.type === "cap-rise" ? action.value : state.capRiseDraft;
    const result = validateDesignerDraft(draft, profileKind, capRiseDraft);
    return {
      ...state,
      draft,
      profileKind,
      capRiseDraft,
      message: "",
      dimensions:
        result.dimensions.success && result.profile.success
          ? result.dimensions.data
          : state.dimensions,
      profile:
        result.dimensions.success && result.profile.success
          ? result.profile.data
          : state.profile,
    };
  }
  if (action.type === "reset-dimensions") {
    return {
      ...state,
      draft: createDimensionDraft(),
      dimensions: DEMO_DESIGN.dimensions,
      capRiseDraft: "8",
      profile:
        state.profileKind === "upright-straight"
          ? { kind: "upright-straight" }
          : { kind: "upright-oval", capRiseIn: 8 },
      message: "",
    };
  }
  if (action.type === "select") {
    return { ...state, selectedId: action.id, message: "" };
  }
  const current = state.inscriptions.find((item) => item.id === action.id);
  if (!current) return state;
  let candidate: InscriptionElement;
  if (action.type === "center-horizontal") {
    candidate = { ...current, xIn: state.dimensions.tablet.width / 2 };
  } else if (action.type === "reset-position") {
    const defaults = createDefaultInscriptionElements(
      state.dimensions.tablet,
    ).find((item) => item.id === action.id)!;
    candidate = {
      ...current,
      xIn: defaults.xIn,
      yIn: defaults.yIn,
      fontSizeIn: defaults.fontSizeIn,
    };
  } else if (action.type === "nudge") {
    try {
      candidate = moveInscription(current, action.dx, action.dy);
    } catch {
      return {
        ...state,
        message:
          "Movement exceeds the prototype position limits (−240 to 240 in).",
      };
    }
  } else {
    candidate = { ...current, ...action.patch, id: current.id };
  }
  const result = inscriptionElementSchema.safeParse(candidate);
  if (!result.success)
    return {
      ...state,
      message: result.error.issues[0]?.message ?? "Invalid inscription.",
    };
  const drafts = { ...state.inscriptionDrafts[current.id] };
  const appliedProperties: InscriptionNumericProperty[] =
    action.type === "reset-position"
      ? ["xIn", "yIn", "fontSizeIn"]
      : action.type === "center-horizontal"
        ? ["xIn"]
        : action.type === "nudge"
          ? ["xIn", "yIn"]
          : (["xIn", "yIn", "fontSizeIn"] as const).filter(
              (property) => property in action.patch,
            );
  for (const property of appliedProperties) delete drafts[property];
  return {
    ...state,
    message: "",
    inscriptionDrafts: { ...state.inscriptionDrafts, [current.id]: drafts },
    inscriptions: state.inscriptions.map((item) =>
      item.id === action.id ? result.data : item,
    ),
  };
}
