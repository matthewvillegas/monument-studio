import { DEMO_PROJECT } from "@/data/mock-designer";
import type { DimensionFieldPath } from "@/types/design";
import type { MonumentGeometry } from "@/types/profile";

interface AnalysisPanelProps {
  geometry: MonumentGeometry;
  pixelsPerInch: number;
  errors: Partial<Record<DimensionFieldPath, string>>;
  profileError: string | undefined;
}

function formatDimension(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export function AnalysisPanel({
  geometry,
  pixelsPerInch,
  errors,
  profileError,
}: AnalysisPanelProps) {
  const { tablet, base } = geometry.dimensions;
  const errorMessages = [...Object.values(errors), profileError].filter(
    (message): message is string => Boolean(message),
  );
  const isValid = errorMessages.length === 0;

  return (
    <aside
      aria-label="Design details"
      className="designer-panel analysis-panel"
    >
      <div className="panel-intro">
        <p className="eyebrow">Design details</p>
        <h2 className="mt-1 font-serif text-[1.65rem] leading-none text-[var(--ink)]">
          At a glance
        </h2>
        <p className="mt-3 text-sm leading-5 text-[var(--muted)]">
          Your monument and base, shown in proportion from the front and side.
        </p>
      </div>

      <section className="panel-section" aria-labelledby="geometry-summary">
        <p id="geometry-summary" className="panel-section-title">
          Current measurements
        </p>
        <dl className="property-list mt-3">
          <div>
            <dt>Shape</dt>
            <dd>
              {geometry.profile.kind === "upright-oval"
                ? "Oval-top upright"
                : "Straight-top upright"}
            </dd>
          </div>
          {geometry.profile.kind === "upright-oval" && (
            <div>
              <dt>Cap rise</dt>
              <dd>{formatDimension(geometry.profile.capRiseIn)} in</dd>
            </div>
          )}
          <div>
            <dt>Tablet</dt>
            <dd>
              {formatDimension(tablet.width)} × {formatDimension(tablet.height)}{" "}
              × {formatDimension(tablet.thickness)} in
            </dd>
          </div>
          <div>
            <dt>Base</dt>
            <dd>
              {formatDimension(base.width)} × {formatDimension(base.height)} ×{" "}
              {formatDimension(base.depth)} in
            </dd>
          </div>
          <div>
            <dt>Overall dimensions</dt>
            <dd>
              {formatDimension(geometry.overall.width)} ×{" "}
              {formatDimension(geometry.overall.height)} in
            </dd>
          </div>
          <div>
            <dt>Overall depth</dt>
            <dd>{formatDimension(geometry.overall.depth)} in</dd>
          </div>
        </dl>
        <details className="technical-details mt-4">
          <summary>Drawing scale</summary>
          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
            Both views use {pixelsPerInch.toFixed(2)} drawing units per inch.
            The drawing fits your screen; it is not a full-size template.
          </p>
        </details>
      </section>

      <section className="panel-section" aria-labelledby="surface-summary">
        <p id="surface-summary" className="panel-section-title">
          Granite preview
        </p>
        <dl className="property-list mt-3">
          <div>
            <dt>Granite</dt>
            <dd>{DEMO_PROJECT.material.name} · Sample</dd>
          </div>
          <div>
            <dt>Finish</dt>
            <dd>{DEMO_PROJECT.finish.name} · Sample</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs leading-[1.55] text-[var(--muted)]">
          Colors and finishes are representative only. Supplier-specific data
          has not been added.
        </p>
      </section>

      <section
        className={`validation-card ${isValid ? "is-valid" : "is-invalid"}`}
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex items-center gap-2.5">
          <span className="validation-mark" aria-hidden="true">
            {isValid ? "✓" : "!"}
          </span>
          <div>
            <p className="text-sm font-semibold text-[var(--ink)]">
              {isValid ? "Measurements look good" : "Review measurements"}
            </p>
            <p className="mt-0.5 text-xs text-[var(--muted)]">
              {isValid
                ? "Within the current design limits."
                : errorMessages.length === 1
                  ? "1 field needs attention."
                  : `${errorMessages.length} fields need attention.`}
            </p>
          </div>
        </div>
        {!isValid ? (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-xs leading-4 text-[var(--error)]">
            {errorMessages.map((message, index) => (
              <li key={`${message}-${index}`}>{message}</li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="panel-section mt-auto" aria-labelledby="phase-status">
        <p id="phase-status" className="panel-section-title">
          Important notes
        </p>
        <p className="mt-3 text-xs leading-[1.6] text-[var(--muted)]">
          Open Design Review for estimated area and volume. Save or download your
          design using the actions above. Weight, pricing, and cemetery review
          are not available.
        </p>
        <p className="disclaimer mt-4">
          This preview is a preliminary visualization and may differ from the
          final monument due to material variation, engraving methods, supplier
          specifications, and production requirements.
        </p>
      </section>
    </aside>
  );
}
