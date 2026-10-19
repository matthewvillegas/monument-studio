import { useId, useLayoutEffect, useRef } from "react";
import { InscriptionGlyph } from "@/components/canvas/inscription-glyph";
import type { RectInches, SizeInches } from "@/types/design";
import type { InscriptionElement, InscriptionId } from "@/types/inscription";
import { getLayoutGuide } from "@/lib/geometry/profile-guide";
import type { MonumentProfile } from "@/types/profile";

export function inscriptionMeasurementKey(element: InscriptionElement): string {
  return JSON.stringify(element);
}

export interface InscriptionLayerProps {
  elements: InscriptionElement[];
  selectedId: InscriptionId;
  bounds: Partial<Record<InscriptionId, RectInches>>;
  showGuide: boolean;
  onSelect: (id: InscriptionId) => void;
  onNudge: (id: InscriptionId, dx: number, dy: number) => void;
  onMeasure: (
    id: InscriptionId,
    key: string,
    bounds: RectInches | undefined,
  ) => void;
}

function InscriptionText({
  element,
  selected,
  bounds,
  onSelect,
  onNudge,
  onMeasure,
  instructionsId,
}: {
  element: InscriptionElement;
  selected: boolean;
  bounds: RectInches | undefined;
  instructionsId: string;
} & Pick<InscriptionLayerProps, "onSelect" | "onNudge" | "onMeasure">) {
  const textRef = useRef<SVGTextElement>(null);
  useLayoutEffect(() => {
    let active = true;
    function measure() {
      if (!active) return;
      const box = textRef.current?.getBBox();
      // getBBox returns local user units (inches), before the drawing scale transform.
      onMeasure(
        element.id,
        inscriptionMeasurementKey(element),
        box && {
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
        },
      );
    }
    measure();
    void document.fonts.ready.then(measure);
    document.fonts.addEventListener("loadingdone", measure);
    return () => {
      active = false;
      document.fonts.removeEventListener("loadingdone", measure);
    };
  }, [element, onMeasure]);

  if (!element.content.trim()) return null;
  return (
    <g
      className="canvas-text-element"
      role="button"
      tabIndex={0}
      aria-label={`Select ${element.id} inscription: ${element.content}`}
      aria-pressed={selected}
      aria-describedby={instructionsId}
      onClick={() => onSelect(element.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(element.id);
          return;
        }
        const step = event.shiftKey ? 1 : 0.25;
        const directions: Record<string, [number, number]> = {
          ArrowLeft: [-step, 0],
          ArrowRight: [step, 0],
          ArrowUp: [0, -step],
          ArrowDown: [0, step],
        };
        const movement = directions[event.key];
        if (movement && !event.altKey && !event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          onSelect(element.id);
          onNudge(element.id, ...movement);
        }
      }}
    >
      {bounds && (
        <rect
          x={bounds.x - 0.35}
          y={bounds.y - 0.35}
          width={bounds.width + 0.7}
          height={bounds.height + 0.7}
          className={selected ? "inscription-selection" : undefined}
          fill="transparent"
          stroke="none"
        />
      )}
      <InscriptionGlyph element={element} ref={textRef} />
    </g>
  );
}

export function InscriptionLayer({
  elements,
  selectedId,
  bounds,
  showGuide,
  tablet,
  profile,
  ...callbacks
}: InscriptionLayerProps & { tablet: SizeInches; profile: MonumentProfile }) {
  const guide = getLayoutGuide(tablet, profile);
  const instructionsId = useId();
  return (
    <g>
      <desc id={instructionsId}>
        Press Enter or Space to select text. Arrow keys move it a quarter inch;
        hold Shift for one inch. Position controls are also available under Inscription.
      </desc>
      {showGuide && guide.kind === "rectangle" && (
        <rect
          aria-hidden="true"
          data-testid="engraving-guide"
          {...guide.rect}
          className="guide-line"
        />
      )}
      {showGuide && guide.kind === "oval" && (
        <path
          aria-hidden="true"
          data-testid="engraving-guide"
          className="guide-line"
          d={`M ${guide.leftIn} ${guide.bottomIn} L ${guide.leftIn} ${guide.edgeYIn} A ${guide.radiusXIn} ${guide.radiusYIn} 0 0 1 ${guide.centerXIn} ${guide.topYIn} A ${guide.radiusXIn} ${guide.radiusYIn} 0 0 1 ${guide.rightIn} ${guide.edgeYIn} L ${guide.rightIn} ${guide.bottomIn} Z`}
        />
      )}
      {elements.map((element) => (
        <InscriptionText
          key={element.id}
          element={element}
          selected={selectedId === element.id}
          bounds={bounds[element.id]}
          instructionsId={instructionsId}
          {...callbacks}
        />
      ))}
    </g>
  );
}
