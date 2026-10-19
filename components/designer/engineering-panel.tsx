import { calculateNominalVolumes } from "@/lib/engineering/volumes";
import type { MonumentGeometry } from "@/types/profile";

/** Numerical results come from the canonical solid, never the fitted drawing. */
export function EngineeringPanel({
  geometry,
  isDraftValid,
  warningCount,
}: {
  geometry: MonumentGeometry;
  isDraftValid: boolean;
  warningCount: number;
}) {
  const volumes = calculateNominalVolumes(
    geometry.dimensions,
    geometry.profile,
  );
  const rows = [
    ["Tablet face area", volumes.tabletAreaIn2, "in²", "profile-area-in2"],
    ["Tablet volume", volumes.tabletVolumeIn3, "in³", "tablet-volume-in3"],
    ["Base volume", volumes.baseVolumeIn3, "in³", "base-volume-in3"],
    ["Total volume", volumes.totalVolumeIn3, "in³", "total-volume-in3"],
    ["Total volume", volumes.totalVolumeFt3, "ft³", "total-volume-ft3"],
  ] as const;
  return (
    <aside
      className="designer-panel configuration-panel"
      aria-label="Design review"
    >
      <div className="panel-intro">
        <p className="eyebrow">Design review</p>
        <h2 className="mt-1 font-serif text-[1.65rem]">Design quantities</h2>
        <p className="mt-2 text-sm leading-5 text-[var(--muted)]">
          Estimated solid-stone area and volume from your shape and measurements.
        </p>
      </div>
      <section className="panel-section" aria-labelledby="volume-heading">
        <h3 id="volume-heading" className="panel-section-title">
          Area &amp; volume
        </h3>
        <dl className="property-list volume-list mt-3">
          {rows.map(([label, value, unit, id]) => (
            <div key={id}>
              <dt>{label}</dt>
              <dd>
                <span data-testid={id}>
                  {value.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>{" "}
                {unit}
              </dd>
            </div>
          ))}
        </dl>
        {!isDraftValid && (
          <p role="status" className="issue-banner mt-4">
            Using the last valid measurements. Correct the highlighted fields in
            Monument.
          </p>
        )}
        <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
          Calculated at full precision; rounded here for readability.
        </p>
      </section>
      <section className="panel-section">
        <h3 className="panel-section-title">Text placement</h3>
        <p className="mt-3 text-sm leading-5">
          {warningCount
            ? `${warningCount} layout warning${warningCount === 1 ? "" : "s"}. Open Inscription to review before proceeding.`
            : "Your text fits the current layout guide. No overlaps detected."}
        </p>
        <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
          Layout checks are visual aids, not verified engraving clearances.
        </p>
      </section>
      <section className="panel-section">
        <details className="technical-details">
          <summary>How these numbers are calculated</summary>
          <div className="mt-3 space-y-3 text-xs leading-5 text-[var(--muted)]">
            <p>
              W = tablet width, H = height, T = thickness. R = oval cap rise.
              All lengths are in inches.
            </p>
            <p>
              {geometry.profile.kind === "upright-oval"
                ? "Oval area = W(H − R) + πWR / 4. The top is a half ellipse above a rectangular body."
                : "Straight-top area = W × H."}
            </p>
            <p>
              Tablet volume = area × T. Base volume = width × height × depth.
              Total ft³ = total in³ / 1,728.
            </p>
            <p>
              Uniform thickness, solid tablet and rectangular base. No
              deductions for engraving, bevels, holes, joints, or fabrication
              waste.
            </p>
          </div>
        </details>
      </section>
      <section className="panel-section mt-auto">
        <p className="disclaimer">
          Volume only — no material density has been verified. These quantities
          do not establish weight, structural safety, lifting requirements, or
          manufacturing approval. Use Save Design to preserve your work in this
          browser.
        </p>
      </section>
    </aside>
  );
}
