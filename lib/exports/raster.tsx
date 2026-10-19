import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { MonumentDrawing } from "@/components/canvas/monument-drawing";
import { InscriptionGlyph } from "@/components/canvas/inscription-glyph";
import { PREVIEW_LAYOUT } from "@/lib/geometry/preview";
import { checkInscriptionLayout } from "@/lib/inscriptions/layout";
import { prepareExportModel } from "@/lib/exports/model";
import type { RectInches } from "@/types/design";
import type { InscriptionId } from "@/types/inscription";

export const DESIGN_IMAGE_WIDTH = 3840;
export const DESIGN_IMAGE_HEIGHT = 2440;

export class DrawingExportError extends Error {
  override name = "DrawingExportError";
}

/** Bounded waits prevent a failed browser font/image operation leaving busy UI forever. */
async function bounded<T>(promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new DrawingExportError("The drawing took too long to prepare. Please try again.")), 20_000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Mount the shared renderer for an immutable, validated snapshot. This is not a
 * screenshot of UI or a second geometry implementation. Temporary DOM, URLs and
 * canvas memory are released on success AND failure.
 */
export async function createDesignImage(input: unknown) {
  const model = prepareExportModel(input);
  for (const element of model.document.inscriptions) {
    // XML 1.0 cannot represent these characters even though JSON can preserve them.
    if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/u.test(element.content) || !element.content.isWellFormed()) {
      throw new DrawingExportError("Some inscription characters cannot be drawn. Remove hidden control characters and try again.");
    }
  }
  const container = document.createElement("div");
  container.setAttribute("aria-hidden", "true");
  container.inert = true;
  Object.assign(container.style, {
    position: "fixed", left: "-20000px", top: "0", width: "960px", height: "610px",
    opacity: "0", pointerEvents: "none", overflow: "hidden",
  });
  document.body.append(container);
  const root = createRoot(container);
  let imageUrl: string | undefined;
  let canvas: HTMLCanvasElement | undefined;
  try {
    flushSync(() => root.render(
      <MonumentDrawing geometry={model.geometry} forExport idPrefix="export-"
        inscriptions={<>{model.document.inscriptions.filter((element) => element.content.trim()).map((element) => <InscriptionGlyph key={element.id} element={element} />)}</>}
      />,
    ));
    await bounded(document.fonts.ready);
    const svg = container.querySelector("svg");
    if (!svg) throw new Error("Drawing did not mount.");
    const bounds: Partial<Record<InscriptionId, RectInches>> = {};
    for (const element of model.document.inscriptions) {
      const node = svg.querySelector<SVGTextElement>(`[data-testid="inscription-${element.id}"]`);
      if (!node) continue;
      const box = node.getBBox();
      bounds[element.id] = { x: box.x, y: box.y, width: box.width, height: box.height };
    }
    const warnings = checkInscriptionLayout(model.document.inscriptions, bounds, model.document.dimensions.tablet, 1, model.document.profile);
    if (warnings.some((warning) => warning.kind === "outside-face" || warning.kind === "unmeasured")) {
      throw new DrawingExportError("Some lettering extends outside the monument or could not be measured. Review Text Details and adjust its placement before creating an image or PDF. Your design has not changed.");
    }
    // Even valid physical dimensions can produce overlong decimal labels. Do not
    // silently crop those labels at the fixed export boundary.
    for (const node of svg.querySelectorAll<SVGTextElement>("text")) {
      const box = node.getBBox();
      const transform = node.getCTM();
      if (!transform) throw new Error("Text transform is unavailable.");
      for (const [x, y] of [[box.x, box.y], [box.x + box.width, box.y], [box.x, box.y + box.height], [box.x + box.width, box.y + box.height]]) {
        const point = new DOMPoint(x, y).matrixTransform(transform);
        if (point.x < 0 || point.y < 0 || point.x > PREVIEW_LAYOUT.viewBox.width || point.y > PREVIEW_LAYOUT.viewBox.height) {
          throw new DrawingExportError("A drawing label would be cut off. Use shorter decimal measurements or adjust the lettering, then try again.");
        }
      }
    }
    svg.setAttribute("width", "960");
    svg.setAttribute("height", "610");
    const source = new XMLSerializer().serializeToString(svg);
    imageUrl = URL.createObjectURL(new Blob([source], { type: "image/svg+xml;charset=utf-8" }));
    const image = new Image();
    const loaded = new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("The browser could not decode the drawing."));
    });
    image.src = imageUrl;
    await bounded(loaded);
    canvas = document.createElement("canvas");
    canvas.width = DESIGN_IMAGE_WIDTH;
    canvas.height = DESIGN_IMAGE_HEIGHT;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas unavailable.");
    context.fillStyle = "#f8f6f1";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await bounded(new Promise<Blob>((resolve, reject) => canvas!.toBlob((result) => result ? resolve(result) : reject(new Error("PNG encoding failed.")), "image/png")));
    return { blob, warnings: warnings.map((warning) => warning.message), model };
  } finally {
    root.unmount();
    container.remove();
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    if (canvas) { canvas.width = 0; canvas.height = 0; }
  }
}
