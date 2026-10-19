import type { Ref } from "react";
import type { InscriptionElement } from "@/types/inscription";

// Match --font-display, but resolve without the application stylesheet in exports.
export const INSCRIPTION_FONT_FAMILY =
  '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif';

/** The same tablet-local inch coordinates and baseline are used in both views. */
export function InscriptionGlyph({
  element,
  ref,
}: {
  element: InscriptionElement;
  ref?: Ref<SVGTextElement>;
}) {
  if (!element.content.trim()) return null;
  return (
    <text
      ref={ref}
      data-testid={`inscription-${element.id}`}
      x={element.xIn}
      y={element.yIn}
      fontSize={element.fontSizeIn}
      textAnchor="middle"
      fill="#f2ede4"
      fontFamily={INSCRIPTION_FONT_FAMILY}
      style={{ userSelect: "none" }}
    >
      {element.content}
    </text>
  );
}
