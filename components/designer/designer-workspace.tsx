"use client";

import { useCallback, useMemo, useReducer, useState } from "react";
import { MonumentCanvas } from "@/components/canvas/monument-canvas";
import { inscriptionMeasurementKey } from "@/components/canvas/inscription-layer";
import { AnalysisPanel } from "@/components/designer/analysis-panel";
import { ConfigurationPanel } from "@/components/designer/configuration-panel";
import { EngineeringPanel } from "@/components/designer/engineering-panel";
import {
  InscriptionEditor,
  INSCRIPTION_LABELS,
} from "@/components/designer/inscription-editor";
import { InscriptionInspector } from "@/components/designer/inscription-inspector";
import { createDesignerState, designerReducer } from "@/lib/designer/state";
import { validateDesignerDraft } from "@/lib/designer/draft";
import { createPreviewTransforms } from "@/lib/geometry/preview";
import { createMonumentGeometry } from "@/lib/geometry/profiles";
import { checkInscriptionLayout } from "@/lib/inscriptions/layout";
import { getDimensionErrors } from "@/lib/validation/dimensions";
import type { RectInches } from "@/types/design";
import type { InscriptionId } from "@/types/inscription";
import { DesignActions } from "@/components/designer/design-actions";
import { createDesignDocument } from "@/lib/persistence/document";

export function DesignerWorkspace() {
  const [state, dispatch] = useReducer(
    designerReducer,
    undefined,
    createDesignerState,
  );
  const [mode, setMode] = useState<"monument" | "inscriptions" | "review">(
    "monument",
  );
  const [showGuide, setShowGuide] = useState(true);
  const [measurements, setMeasurements] = useState<
    Partial<
      Record<InscriptionId, { key: string; bounds: RectInches | undefined }>
    >
  >({});
  const validation = useMemo(
    () =>
      validateDesignerDraft(state.draft, state.profileKind, state.capRiseDraft),
    [state.draft, state.profileKind, state.capRiseDraft],
  );
  const errors = getDimensionErrors(validation.dimensions);
  const document = useMemo(
    () =>
      createDesignDocument({
        dimensions: state.dimensions,
        profile: state.profile,
        inscriptions: state.inscriptions,
      }),
    [state.dimensions, state.profile, state.inscriptions],
  );
  const hasTextDrafts = Object.values(state.inscriptionDrafts).some(
    (drafts) => Object.keys(drafts).length > 0,
  );
  const fieldLabels = {
    xIn: "X center",
    yIn: "Y baseline",
    fontSizeIn: "Font size",
  };
  const unfinishedText = state.inscriptions.flatMap(({ id }) => {
    const fields = Object.keys(
      state.inscriptionDrafts[id] ?? {},
    ) as (keyof typeof fieldLabels)[];
    return fields.length
      ? [
          `${INSCRIPTION_LABELS[id]} (${fields.map((field) => fieldLabels[field]).join(", ")})`,
        ]
      : [];
  });
  const pendingEditDescription = [
    !validation.success
      ? "Open 01 · Monument to correct the dimensions or cap rise."
      : "",
    hasTextDrafts
      ? `Open 02 · Inscription and select ${unfinishedText.join("; ")}. X and Y are under Fine-tune position.`
      : "",
  ]
    .filter(Boolean)
    .join(" ");
  const profileError = validation.profile.success
    ? undefined
    : validation.profile.error.issues[0]?.message;
  const geometry = useMemo(
    () => createMonumentGeometry(state.dimensions, state.profile),
    [state.dimensions, state.profile],
  );
  const bounds: Partial<Record<InscriptionId, RectInches>> = {};
  for (const element of state.inscriptions) {
    const measurement = measurements[element.id];
    // Old measurements must never certify a new text/position.
    if (
      measurement?.key === inscriptionMeasurementKey(element) &&
      measurement.bounds
    )
      bounds[element.id] = measurement.bounds;
  }
  const warnings = checkInscriptionLayout(
    state.inscriptions,
    bounds,
    state.dimensions.tablet,
    1,
    state.profile,
  );
  const handleMeasure = useCallback(
    (id: InscriptionId, key: string, nextBounds: RectInches | undefined) => {
      setMeasurements((previous) => {
        const next = { key, bounds: nextBounds };
        return JSON.stringify(previous[id]) === JSON.stringify(next)
          ? previous
          : { ...previous, [id]: next };
      });
    },
    [],
  );
  function select(id: InscriptionId) {
    dispatch({ type: "select", id });
    setMode("inscriptions");
  }
  function nudge(id: InscriptionId, dx: number, dy: number) {
    dispatch({ type: "nudge", id, dx, dy });
  }

  return (
    <main className="designer-workspace">
      <nav className="skip-links" aria-label="Skip links">
        <a href="#design-controls" tabIndex={0}>Skip to design controls</a>
        <a href="#monument-preview" tabIndex={0}>Skip to drawing</a>
      </nav>
      <div id="design-controls" tabIndex={-1} role="group" className="workspace-toolbar" aria-label="Drawing controls">
        <div>
          <button
            className="quiet-button"
            type="button"
            aria-pressed={mode === "monument"}
            onClick={() => setMode("monument")}
          >
            01 · Monument
          </button>
          <button
            className="quiet-button"
            type="button"
            aria-pressed={mode === "inscriptions"}
            onClick={() => select(state.selectedId)}
          >
            02 · Inscription
          </button>
          <button
            className="quiet-button"
            type="button"
            aria-pressed={mode === "review"}
            onClick={() => setMode("review")}
          >
            03 · Design Review
          </button>
          <button
            className="quiet-button"
            type="button"
            aria-pressed={showGuide}
            onClick={() => setShowGuide((value) => !value)}
          >
            Show Layout Guidelines
          </button>
        </div>
        <p>Design in inches · preview only</p>
      </div>
      <DesignActions
        document={document}
        canSave={validation.success && !hasTextDrafts}
        hasPendingEdits={!validation.success || hasTextDrafts}
        pendingEditDescription={pendingEditDescription}
        onLoad={(document) => {
          dispatch({ type: "load-document", document });
          setMeasurements({});
        }}
      />
      <div className="mobile-advisory" role="note">
        Use Expand drawing for a closer look. Your measurements stay the same.
      </div>
      <div className="designer-grid">
        {mode === "monument" ? (
          <ConfigurationPanel
            draft={state.draft}
            errors={errors}
            profileKind={state.profileKind}
            capRiseDraft={state.capRiseDraft}
            profileError={profileError}
            onProfileChange={(kind) => dispatch({ type: "profile", kind })}
            onCapRiseChange={(value) => dispatch({ type: "cap-rise", value })}
            onDimensionChange={(field, value) =>
              dispatch({ type: "dimension", field, value })
            }
            onReset={() => dispatch({ type: "reset-dimensions" })}
          />
        ) : mode === "review" ? (
          <EngineeringPanel
            geometry={geometry}
            isDraftValid={validation.success}
            warningCount={warnings.length}
          />
        ) : (
          <aside
            aria-label="Inscription content"
            className="designer-panel configuration-panel"
          >
            <div className="panel-intro">
              <p className="eyebrow">Lettering workspace</p>
              <h2 className="mt-1 font-serif text-[1.65rem]">
                Text Details
              </h2>
              <p className="mt-2 text-sm leading-5 text-[var(--muted)]">
                Name, dates, and a line of remembrance. All text below is
                editable.
              </p>
            </div>
            <InscriptionEditor
              elements={state.inscriptions}
              selectedId={state.selectedId}
              onSelect={select}
              onChange={(id, content) =>
                dispatch({ type: "inscription", id, patch: { content } })
              }
            />
          </aside>
        )}
        <MonumentCanvas
          geometry={geometry}
          isDraftValid={validation.success}
          inscriptions={{
            elements: state.inscriptions,
            selectedId: state.selectedId,
            bounds,
            showGuide,
            onSelect: select,
            onNudge: nudge,
            onMeasure: handleMeasure,
          }}
          warningCount={warnings.length}
        />
        {mode !== "inscriptions" ? (
          <AnalysisPanel
            geometry={geometry}
            pixelsPerInch={createPreviewTransforms(geometry).pixelsPerInch}
            errors={errors}
            profileError={profileError}
          />
        ) : (
          <InscriptionInspector
            elements={state.inscriptions}
            selectedId={state.selectedId}
            warnings={warnings}
            message={state.message}
            onSelect={select}
            onChange={(id, patch) =>
              dispatch({ type: "inscription", id, patch })
            }
            onNudge={nudge}
            onReset={(id) => dispatch({ type: "reset-position", id })}
            onCenter={(id) => dispatch({ type: "center-horizontal", id })}
            drafts={state.inscriptionDrafts}
            onDraftChange={(id, property, value) =>
              dispatch({ type: "inscription-draft", id, property, value })
            }
          />
        )}
      </div>
    </main>
  );
}
