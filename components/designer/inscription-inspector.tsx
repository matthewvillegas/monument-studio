import { INSCRIPTION_LABELS } from "@/components/designer/inscription-editor";
import {
  inscriptionElementSchema,
  INSCRIPTION_LIMITS,
} from "@/lib/validation/inscriptions";
import type {
  InscriptionElement,
  InscriptionId,
  InscriptionLayoutWarning,
  InscriptionDrafts,
  InscriptionNumericProperty,
} from "@/types/inscription";

function PositionField({
  element,
  property,
  label,
  onChange,
  draft,
  onDraftChange,
}: {
  element: InscriptionElement;
  property: InscriptionNumericProperty;
  label: string;
  onChange: (patch: Partial<InscriptionElement>) => void;
  draft: string | undefined;
  onDraftChange: (property: InscriptionNumericProperty, value: string) => void;
}) {
  const inputValue = draft ?? String(element[property]);
  const numericValue = inputValue.trim() === "" ? NaN : Number(inputValue);
  const validation = inscriptionElementSchema.safeParse({
    ...element,
    [property]: numericValue,
  });
  const error =
    draft !== undefined && !validation.success
      ? (validation.error.issues[0]?.message ?? "Enter a valid number.")
      : "";
  const limits =
    property === "fontSizeIn"
      ? INSCRIPTION_LIMITS.fontSizeIn
      : INSCRIPTION_LIMITS.coordinateIn;
  function commit() {
    if (validation.success && draft !== undefined)
      onChange({ [property]: numericValue });
  }
  return (
    <div className="inspector-field">
      <label htmlFor={`position-${property}`}>{label}</label>
      <input
        id={`position-${property}`}
        type="number"
        step="any"
        min={limits.min}
        max={limits.max}
        value={inputValue}
        required
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${property}-error` : undefined}
        onChange={(event) => onDraftChange(property, event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
      />
      {error && (
        <p
          id={`${property}-error`}
          className="mt-1 text-xs text-[var(--error)]"
          role="alert"
        >
          {error} Preview unchanged.
        </p>
      )}
    </div>
  );
}

export function InscriptionInspector({
  elements,
  selectedId,
  warnings,
  message,
  onSelect,
  onChange,
  onNudge,
  onReset,
  onCenter,
  drafts,
  onDraftChange,
}: {
  elements: InscriptionElement[];
  selectedId: InscriptionId;
  warnings: InscriptionLayoutWarning[];
  message: string;
  onSelect: (id: InscriptionId) => void;
  onChange: (id: InscriptionId, patch: Partial<InscriptionElement>) => void;
  onNudge: (id: InscriptionId, dx: number, dy: number) => void;
  onReset: (id: InscriptionId) => void;
  onCenter: (id: InscriptionId) => void;
  drafts: InscriptionDrafts;
  onDraftChange: (
    id: InscriptionId,
    property: InscriptionNumericProperty,
    value: string,
  ) => void;
}) {
  const selected = elements.find((element) => element.id === selectedId)!;
  return (
    <aside
      className="designer-panel analysis-panel"
      aria-label="Inscription properties"
    >
      <div className="panel-intro">
        <p className="eyebrow">Text details</p>
        <h2 className="mt-1 font-serif text-[1.65rem]">
          {INSCRIPTION_LABELS[selectedId]} inscription
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Select a line, then adjust its size and placement.
        </p>
      </div>
      <section className="panel-section" aria-label="Select inscription">
        <div className="grid gap-2">
          {elements.map((element) => (
            <button
              key={element.id}
              type="button"
              className="text-element-choice"
              aria-pressed={selectedId === element.id}
              onClick={() => onSelect(element.id)}
            >
              <strong>{INSCRIPTION_LABELS[element.id]}</strong>
              <span className="truncate text-[var(--muted)]">
                {element.content || "Not added"}
              </span>
            </button>
          ))}
        </div>
      </section>
      <section className="panel-section" aria-labelledby="position-heading">
        <h3 id="position-heading" className="panel-section-title">
          Adjust Text Placement
        </h3>
        <p className="my-3 text-xs leading-5 text-[var(--muted)]">
          Center this line or move it a little at a time. Font size applies when
          you press Enter or leave the field.
        </p>
        <PositionField
          key={`${selected.id}-fontSizeIn-${selected.fontSizeIn}`}
          element={selected}
          property="fontSizeIn"
          label="Font size (in)"
          onChange={(patch) => onChange(selected.id, patch)}
          draft={drafts[selected.id]?.fontSizeIn}
          onDraftChange={(property, value) =>
            onDraftChange(selected.id, property, value)
          }
        />
        <button
          type="button"
          className="reset-button mt-3"
          onClick={() => onCenter(selected.id)}
        >
          Center horizontally
        </button>
        <details className="technical-details mt-4">
          <summary>Fine-tune position</summary>
          <p className="my-3 text-xs leading-5 text-[var(--muted)]">
            Measured from the tablet&apos;s top-left corner: X is the text
            center, Y is its baseline (downward). Enter or leave a field to
            apply.
          </p>
          <div className="position-grid">
            {(
              [
                ["xIn", "X center (in)"],
                ["yIn", "Y baseline (in)"],
              ] as const
            ).map(([property, label]) => (
              <PositionField
                key={`${selected.id}-${property}-${selected[property]}`}
                element={selected}
                property={property}
                label={label}
                onChange={(patch) => onChange(selected.id, patch)}
                draft={drafts[selected.id]?.[property]}
                onDraftChange={(property, value) =>
                  onDraftChange(selected.id, property, value)
                }
              />
            ))}
          </div>
        </details>
        <div className="mt-4 flex items-center gap-4">
          <div className="nudge-pad" role="group" aria-label="Move inscription">
            {(
              [
                ["up", "↑", 0, -0.25],
                ["left", "←", -0.25, 0],
                ["right", "→", 0.25, 0],
                ["down", "↓", 0, 0.25],
              ] as const
            ).map(([direction, arrow, dx, dy]) => (
              <button
                key={direction}
                type="button"
                aria-label={`Move ${direction} 0.25 inches`}
                onClick={() => onNudge(selected.id, dx, dy)}
              >
                {arrow}
              </button>
            ))}
          </div>
          <p className="text-xs leading-5 text-[var(--muted)]">
            On focused drawing text:
            <br />
            Arrows: ¼ in
            <br />
            Shift + arrows: 1 in
          </p>
        </div>
        <button
          type="button"
          className="reset-button mt-4"
          onClick={() => onReset(selected.id)}
        >
          Reset Text Layout
        </button>
        <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
          Resets position and size of the selected line only. Your wording stays
          unchanged.
        </p>
        {message && (
          <p className="issue-banner mt-3" role="alert">
            {message}
          </p>
        )}
      </section>
      <section className="panel-section" aria-labelledby="layout-checks">
        <h3 id="layout-checks" className="panel-section-title">
          Layout checks
        </h3>
        <div className="mt-3" aria-live="polite" aria-atomic="true">
          {warnings.length ? (
            <ul className="layout-warnings">
              {warnings.map((warning, index) => (
                <li key={`${warning.id}-${warning.kind}-${index}`}>
                  {warning.message}
                </li>
              ))}
            </ul>
          ) : (
            <p className="issue-banner is-valid">
              Your text fits within the current layout guide. No overlaps
              detected.
            </p>
          )}
        </div>
        <p className="disclaimer mt-4">
          The guide uses a conservative 1 in clearance around text boxes, not a
          verified engraving clearance. Font size is not the exact letter height.
          Text outside the guide stays editable and is never moved automatically.
        </p>
      </section>
    </aside>
  );
}
