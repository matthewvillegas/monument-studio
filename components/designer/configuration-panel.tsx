import { DEMO_PROJECT } from "@/data/mock-designer";
import { DIMENSION_LIMITS } from "@/lib/validation/dimensions";
import type { DimensionDraft, DimensionFieldPath } from "@/types/design";

import { DimensionField } from "@/components/ui/dimension-field";
import type { MonumentProfile } from "@/types/profile";

interface ConfigurationPanelProps {
  draft: DimensionDraft;
  errors: Partial<Record<DimensionFieldPath, string>>;
  profileKind: MonumentProfile["kind"];
  capRiseDraft: string;
  profileError: string | undefined;
  onProfileChange: (kind: MonumentProfile["kind"]) => void;
  onCapRiseChange: (value: string) => void;
  onDimensionChange: (field: DimensionFieldPath, value: string) => void;
  onReset: () => void;
}

interface FieldDefinition {
  path: DimensionFieldPath;
  label: string;
}

const TABLET_FIELDS: FieldDefinition[] = [
  { path: "tablet.width", label: "Width" },
  { path: "tablet.height", label: "Height" },
  { path: "tablet.thickness", label: "Thickness" },
];

const BASE_FIELDS: FieldDefinition[] = [
  { path: "base.width", label: "Width" },
  { path: "base.height", label: "Height" },
  { path: "base.depth", label: "Depth" },
];

function DimensionGroup({
  legend,
  fields,
  draft,
  errors,
  onDimensionChange,
}: {
  legend: string;
  fields: FieldDefinition[];
  draft: DimensionDraft;
  errors: Partial<Record<DimensionFieldPath, string>>;
  onDimensionChange: (field: DimensionFieldPath, value: string) => void;
}) {
  return (
    <fieldset className="panel-section">
      <legend className="panel-section-title">{legend}</legend>
      <div className="mt-4 grid gap-4">
        {fields.map(({ path, label }) => {
          const limits = DIMENSION_LIMITS[path];
          return (
            <DimensionField
              key={path}
              fieldPath={path}
              label={label}
              value={draft[path]}
              min={limits.min}
              max={limits.max}
              error={errors[path]}
              onChange={onDimensionChange}
            />
          );
        })}
      </div>
    </fieldset>
  );
}

export function ConfigurationPanel({
  draft,
  errors,
  profileKind,
  capRiseDraft,
  profileError,
  onProfileChange,
  onCapRiseChange,
  onDimensionChange,
  onReset,
}: ConfigurationPanelProps) {
  return (
    <aside
      aria-label="Monument configuration"
      className="designer-panel configuration-panel"
    >
      <div className="panel-intro">
        <p className="eyebrow">Configuration</p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <h2 className="font-serif text-[1.65rem] leading-none text-[var(--ink)]">
            Shape &amp; size
          </h2>
          <span className="unit-chip">Inches</span>
        </div>
        <p className="mt-3 text-sm leading-5 text-[var(--muted)]">
          Choose a shape, then adjust its measurements. The preview updates as
          you work.
        </p>
      </div>

      <section className="panel-section" aria-label="Shape options">
        <div className="inspector-field">
          <label id="template-heading" htmlFor="monument-shape">
            Monument shape
          </label>
          <select
            id="monument-shape"
            value={profileKind}
            onChange={(event) =>
              onProfileChange(
                event.target.value === "upright-oval"
                  ? "upright-oval"
                  : "upright-straight",
              )
            }
          >
            <option value="upright-straight">Straight-top upright</option>
            <option value="upright-oval">Oval-top upright</option>
          </select>
        </div>
        {profileKind === "upright-oval" && (
          <div className="inspector-field mt-4">
            <label htmlFor="cap-rise">Cap rise (in)</label>
            <input
              id="cap-rise"
              type="number"
              step="any"
              required
              value={capRiseDraft}
              aria-invalid={Boolean(profileError)}
              aria-describedby={`cap-help${profileError ? " cap-error" : ""}`}
              onChange={(event) => onCapRiseChange(event.target.value)}
            />
            <p
              id="cap-help"
              className="mt-2 text-xs leading-5 text-[var(--muted)]"
            >
              Height of the curved top, from shoulder to peak. Must be greater
              than zero and no taller than the tablet.
            </p>
            {profileError && (
              <p
                id="cap-error"
                role="alert"
                className="mt-2 text-xs text-[var(--error)]"
              >
                {profileError} Preview unchanged.
              </p>
            )}
          </div>
        )}
      </section>

      <DimensionGroup
        legend="Tablet dimensions"
        fields={TABLET_FIELDS}
        draft={draft}
        errors={errors}
        onDimensionChange={onDimensionChange}
      />

      <DimensionGroup
        legend="Base dimensions"
        fields={BASE_FIELDS}
        draft={draft}
        errors={errors}
        onDimensionChange={onDimensionChange}
      />

      <section className="panel-section" aria-labelledby="material-heading">
        <p id="material-heading" className="panel-section-title">
          Granite preview
        </p>
        <div className="mt-4 flex items-center gap-3">
          <span
            className="granite-swatch"
            style={{ backgroundColor: DEMO_PROJECT.material.previewColor }}
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-semibold text-[var(--ink)]">
              {DEMO_PROJECT.material.name}
            </p>
            <p className="text-xs text-[var(--muted)]">
              {DEMO_PROJECT.material.description}
            </p>
          </div>
        </div>
      </section>

      <div className="panel-section mt-auto">
        <button type="button" onClick={onReset} className="reset-button">
          Reset to Default Size
        </button>
      </div>
    </aside>
  );
}
