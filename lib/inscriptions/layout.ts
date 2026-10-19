import { inscriptionElementSchema } from "@/lib/validation/inscriptions";
import { faceContainsRect } from "@/lib/geometry/profile-guide";
import type { MonumentProfile } from "@/types/profile";
import type {
  InscriptionElement,
  InscriptionId,
  InscriptionLayoutWarning,
} from "@/types/inscription";
import type { RectInches, SizeInches } from "@/types/design";

const COORDINATE_PRECISION = 1_000_000_000;

const INSCRIPTION_LABELS: Record<InscriptionId, string> = {
  name: "Name",
  dates: "Dates",
  epitaph: "Epitaph",
};

function assertPositiveFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive finite number.`);
  }
}

function assertNonNegativeFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative finite number.`);
  }
}

function roundCoordinate(value: number): number {
  const rounded =
    Math.round(value * COORDINATE_PRECISION) / COORDINATE_PRECISION;
  return Object.is(rounded, -0) ? 0 : rounded;
}

function isBlank(content: string): boolean {
  return content.trim().length === 0;
}

function isMeasuredRect(rect: RectInches | undefined): rect is RectInches {
  return (
    rect !== undefined &&
    Number.isFinite(rect.x) &&
    Number.isFinite(rect.y) &&
    Number.isFinite(rect.width) &&
    Number.isFinite(rect.height) &&
    rect.width > 0 &&
    rect.height > 0
  );
}

function rectanglesOverlap(first: RectInches, second: RectInches): boolean {
  return (
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y
  );
}

export function createDefaultInscriptionElements(
  tablet: SizeInches,
): InscriptionElement[] {
  assertPositiveFinite(tablet.width, "Tablet width");
  assertPositiveFinite(tablet.height, "Tablet height");

  return [
    {
      id: "name",
      content: "FAMILY NAME",
      xIn: tablet.width / 2,
      yIn: tablet.height * 0.4,
      fontSizeIn: 2.5,
    },
    {
      id: "dates",
      content: "19XX — 20XX",
      xIn: tablet.width / 2,
      yIn: tablet.height * 0.58,
      fontSizeIn: 1.15,
    },
    {
      id: "epitaph",
      content: "",
      xIn: tablet.width / 2,
      yIn: tablet.height * 0.76,
      fontSizeIn: 1,
    },
  ].map((element) => inscriptionElementSchema.parse(element));
}

export function moveInscription(
  element: InscriptionElement,
  dxIn: number,
  dyIn: number,
): InscriptionElement {
  const validElement = inscriptionElementSchema.parse(element);
  if (!Number.isFinite(dxIn) || !Number.isFinite(dyIn)) {
    throw new RangeError("Inscription movement must use finite inches.");
  }

  return inscriptionElementSchema.parse({
    ...validElement,
    xIn: roundCoordinate(validElement.xIn + dxIn),
    yIn: roundCoordinate(validElement.yIn + dyIn),
  });
}

/**
 * Checks renderer-measured text bounds expressed in tablet-local inches.
 * Bounds are never inferred from content length or font size.
 */
export function checkInscriptionLayout(
  elements: readonly InscriptionElement[],
  bounds: Partial<Record<InscriptionId, RectInches>>,
  tablet: SizeInches,
  marginIn = 1,
  profile: MonumentProfile = { kind: "upright-straight" },
): InscriptionLayoutWarning[] {
  assertPositiveFinite(tablet.width, "Tablet width");
  assertPositiveFinite(tablet.height, "Tablet height");
  assertNonNegativeFinite(marginIn, "Engraving guide margin");

  const warnings: InscriptionLayoutWarning[] = [];
  const measurable: Array<{
    element: InscriptionElement;
    bounds: RectInches;
  }> = [];

  for (const element of elements) {
    const label = INSCRIPTION_LABELS[element.id];

    if (isBlank(element.content)) {
      if (element.id !== "epitaph") {
        warnings.push({
          id: element.id,
          kind: "empty",
          message: `${label} inscription is empty.`,
        });
      }
      continue;
    }

    const measuredBounds = bounds[element.id];
    if (!isMeasuredRect(measuredBounds)) {
      warnings.push({
        id: element.id,
        kind: "unmeasured",
        message: `${label} bounds are unavailable; layout checks are pending.`,
      });
      continue;
    }

    measurable.push({ element, bounds: measuredBounds });

    if (!faceContainsRect(tablet, profile, measuredBounds)) {
      warnings.push({
        id: element.id,
        kind: "outside-face",
        message: `${label} extends outside the monument face.`,
      });
    }

    if (
      !faceContainsRect(tablet, profile, measuredBounds, marginIn)
    ) {
      warnings.push({
        id: element.id,
        kind: "margin",
        message: `${label} is outside the layout guide. Final placement needs review.`,
      });
    }
  }

  for (let firstIndex = 0; firstIndex < measurable.length; firstIndex += 1) {
    const first = measurable[firstIndex];
    if (first === undefined) {
      continue;
    }

    for (
      let secondIndex = firstIndex + 1;
      secondIndex < measurable.length;
      secondIndex += 1
    ) {
      const second = measurable[secondIndex];
      if (
        second === undefined ||
        !rectanglesOverlap(first.bounds, second.bounds)
      ) {
        continue;
      }

      warnings.push({
        id: first.element.id,
        kind: "overlap",
        message: `${INSCRIPTION_LABELS[first.element.id]} overlaps ${INSCRIPTION_LABELS[second.element.id].toLowerCase()}.`,
      });
      warnings.push({
        id: second.element.id,
        kind: "overlap",
        message: `${INSCRIPTION_LABELS[second.element.id]} overlaps ${INSCRIPTION_LABELS[first.element.id].toLowerCase()}.`,
      });
    }
  }

  return warnings;
}
