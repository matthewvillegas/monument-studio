import { MonumentDrawing } from "@/components/canvas/monument-drawing";
import { DrawingViewport } from "@/components/canvas/drawing-viewport";
import {
  InscriptionLayer,
  type InscriptionLayerProps,
} from "@/components/canvas/inscription-layer";
import type { MonumentGeometry } from "@/types/profile";

interface MonumentCanvasProps {
  geometry: MonumentGeometry;
  isDraftValid: boolean;
  inscriptions: InscriptionLayerProps;
  warningCount: number;
}

export function MonumentCanvas({
  geometry,
  isDraftValid,
  inscriptions,
  warningCount,
}: MonumentCanvasProps) {
  const profileName =
    geometry.profile.kind === "upright-oval"
      ? "Oval-top upright"
      : "Straight-top upright";

  return (
    <section id="monument-preview" tabIndex={-1} className="canvas-panel" aria-label="Monument preview">
      <div className="canvas-toolbar">
        <div>
          <p className="eyebrow">Design preview</p>
          <h2 className="mt-1 font-serif text-xl leading-none text-[var(--ink)]">
            {profileName}
          </h2>
        </div>
        <div className="text-right">
          <p className="text-[0.64rem] font-bold uppercase tracking-[0.15em] text-[var(--muted)]">
            Front &amp; side
          </p>
          <p className="mt-1 text-xs font-semibold tabular-nums text-[var(--ink)]">
            Measurements in inches
          </p>
        </div>
      </div>

      <DrawingViewport>
        <MonumentDrawing
          geometry={geometry}
          inscriptions={
            <InscriptionLayer
              {...inscriptions}
              tablet={geometry.dimensions.tablet}
              profile={geometry.profile}
            />
          }
        />
      </DrawingViewport>

      <div className="canvas-caption">
        <p>
          <span className="font-semibold text-[var(--ink)]">Front + side</span>
          <span aria-hidden="true"> · </span>
          same fitted scale
        </p>
        <p className={isDraftValid ? "" : "text-[var(--error)]"}>
          {isDraftValid
            ? "Preview follows your measurements"
            : "Showing the last valid measurements"}
        </p>
      </div>
      <div
        className="border-t border-[var(--line-dark)] bg-[var(--paper-warm)] px-5 py-2 text-xs text-[var(--muted)]"
        aria-live="polite"
      >
        {warningCount
          ? `${warningCount} inscription layout warning${warningCount === 1 ? "" : "s"} · Open Inscription to review.`
          : "Inscription layout checked · 1 in guide is provisional."}
      </div>
    </section>
  );
}
