import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InscriptionGlyph, INSCRIPTION_FONT_FAMILY } from "@/components/canvas/inscription-glyph";
import { MonumentDrawing } from "@/components/canvas/monument-drawing";
import { DEMO_DESIGN } from "@/data/mock-designer";
import { createMonumentGeometry } from "@/lib/geometry/profiles";
import type { MonumentDimensionsInches } from "@/types/design";
import type { InscriptionElement } from "@/types/inscription";
import type { MonumentGeometry } from "@/types/profile";

const inscription: InscriptionElement = {
  id: "name", content: "FAMILY NAME", xIn: 24.125, yIn: 12.25, fontSizeIn: 2.625,
};

function drawing(geometry: MonumentGeometry, forExport = false, idPrefix = "") {
  return renderToStaticMarkup(createElement(MonumentDrawing, {
    geometry, forExport, idPrefix,
    inscriptions: createElement(InscriptionGlyph, { element: inscription }),
  }));
}

function taggedElement(markup: string, testId: string): string {
  const match = markup.match(new RegExp(`<[^>]+data-testid="${testId}"[^>]*>`));
  if (!match) throw new Error(`Missing drawing element ${testId}`);
  return match[0];
}

const dimensionCases: [string, MonumentDimensionsInches][] = [
  ["standard", DEMO_DESIGN.dimensions],
  ["decimal", {
    tablet: { width: 40.5125, height: 28.2575, thickness: 7.5125 },
    base: { width: 47.7575, height: 7.2575, depth: 10.1255 },
  }],
  ["minimum", {
    tablet: { width: 12, height: 12, thickness: 2 },
    base: { width: 12, height: 2, depth: 4 },
  }],
  ["maximum", {
    tablet: { width: 120, height: 96, thickness: 24 },
    base: { width: 144, height: 24, depth: 48 },
  }],
];

describe("shared workspace and export drawing", () => {
  it("matches independently derived standard front and side coordinates", () => {
    // The front width limits scale to 540 / 60 = 9 px/in. Centered tablet
    // x = 94 + (60-48)/2*9 = 148; y = 76 + (402-38*9)/2 = 106.
    const straight = drawing(createMonumentGeometry(DEMO_DESIGN.dimensions, { kind: "upright-straight" }), true);
    expect(taggedElement(straight, "front-tablet-path")).toContain('d="M 148 106 H 580 V 376 H 148 Z"');
    const side = taggedElement(straight, "side-tablet");
    for (const expected of ['x="69"', 'y="106"', 'width="72"', 'height="270"']) {
      expect(side).toContain(expected);
    }
    // Half-ellipse radii W/2*9 = 216 and R*9 = 72; shoulder at 106+72.
    const oval = drawing(createMonumentGeometry(DEMO_DESIGN.dimensions, { kind: "upright-oval", capRiseIn: 8 }), true);
    expect(taggedElement(oval, "front-tablet-path")).toContain('d="M 148 376 L 148 178 A 216 72 0 0 1 580 178 L 580 376 Z"');
    expect(taggedElement(oval, "side-tablet")).toBe(side);
  });

  it.each(dimensionCases)("preserves identical paths, inscriptions and state at %s dimensions for both profiles", (_label, dimensions) => {
    for (const profile of [
      { kind: "upright-straight" } as const,
      { kind: "upright-oval", capRiseIn: dimensions.tablet.height / 3 } as const,
    ]) {
      const geometry = createMonumentGeometry(dimensions, profile);
      const before = structuredClone(geometry);
      const live = drawing(geometry);
      const exported = drawing(geometry, true);
      for (const id of ["front-tablet-path", "side-tablet", "inscription-name"]) {
        expect(taggedElement(exported, id)).toBe(taggedElement(live, id));
      }
      const transforms = (markup: string) => [...markup.matchAll(/<g transform="([^"]+)"/g)].map((match) => match[1]);
      expect(transforms(exported)).toEqual(transforms(live));
      expect(geometry).toEqual(before);
    }
  });

  it("retains full decimal annotation values without changing geometry", () => {
    const dimensions = dimensionCases[1]![1];
    const geometry = createMonumentGeometry(dimensions, { kind: "upright-oval", capRiseIn: 7.125 });
    const exported = drawing(geometry, true);
    for (const label of ["TABLET 40.5125″", "BASE 47.7575″", "DEPTH 10.1255″", "THK 7.5125″", "OVERALL 35.515″"]) {
      expect(exported).toContain(label);
    }
    expect(drawing(geometry)).toContain("TABLET 40.51″");
  });

  it("is stylesheet independent and namespaces every SVG definition reference", () => {
    const output = drawing(createMonumentGeometry(DEMO_DESIGN.dimensions, { kind: "upright-straight" }), true, "export-42-");
    expect(output).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(output).toContain('id="export-42-granite-surface"');
    expect(output).toContain('fill="url(#export-42-granite-surface)"');
    expect(output).toContain('id="export-42-monument-shadow"');
    expect(output).toContain('filter="url(#export-42-monument-shadow)"');
    expect(output).not.toContain("url(#granite-surface)");
    expect(output).not.toContain("var(--");
    expect(output).toContain("font-size:14px");
    expect(output).toContain("font-size:11px");
    expect(output).toContain("PRELIMINARY VISUALIZATION");
    expect(output).not.toMatch(/MS-DEMO|engraving-guide|inscription-selection|role="button"|tabindex|onkeydown|Select inscription text/);
  });

  it("shares exact glyph anchors and font attributes while escaping untrusted text", () => {
    const hostileText = '<script>alert("x")</script> & FAMILY';
    const element = { ...inscription, content: hostileText };
    const output = renderToStaticMarkup(createElement(InscriptionGlyph, { element }));
    expect(output).toContain('x="24.125" y="12.25" font-size="2.625" text-anchor="middle"');
    expect(output).toContain("Palatino Linotype");
    expect(INSCRIPTION_FONT_FAMILY).toContain("Georgia, serif");
    expect(output).not.toContain("<script>");
    expect(output).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; FAMILY");
    expect(renderToStaticMarkup(createElement(InscriptionGlyph, { element: { ...inscription, content: "   " } }))).toBe("");
  });
});
