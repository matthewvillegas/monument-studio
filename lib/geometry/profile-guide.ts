import { assertValidProfile } from "@/lib/validation/profile";
import type { RectInches, SizeInches } from "@/types/design";
import type { LayoutGuide, MonumentProfile } from "@/types/profile";

function validateFace(
  size: SizeInches,
  profile: MonumentProfile,
  marginIn: number,
) {
  if (
    !Number.isFinite(size.width) ||
    size.width <= 0 ||
    !Number.isFinite(size.height) ||
    size.height <= 0
  ) {
    throw new RangeError("Tablet face dimensions must be positive and finite.");
  }
  if (!Number.isFinite(marginIn) || marginIn < 0) {
    throw new RangeError("Layout margin must be non-negative and finite.");
  }
  return assertValidProfile(profile, size.height);
}

// Equivalent to R(1-sqrt(1-u^2)), rationalized to avoid cancellation near
// the crown. The clamp only absorbs round-off at the ellipse shoulders.
function capTopAtOffset(offsetIn: number, halfWidthIn: number, riseIn: number) {
  const normalized = Math.min(1, Math.abs(offsetIn) / halfWidthIn);
  const square = normalized * normalized;
  return (riseIn * square) / (1 + Math.sqrt(Math.max(0, 1 - square)));
}

/**
 * The face is convex, so containing an axis-aligned box's four corners
 * contains the entire box. A margin expands that box on all four sides.
 * This is conservative square clearance, NOT a Euclidean curve offset.
 */
export function faceContainsRect(
  size: SizeInches,
  inputProfile: MonumentProfile,
  rect: RectInches,
  marginIn = 0,
): boolean {
  const profile = validateFace(size, inputProfile, marginIn);
  if (
    ![rect.x, rect.y, rect.width, rect.height].every(Number.isFinite) ||
    rect.width < 0 ||
    rect.height < 0
  ) {
    return false;
  }
  const left = rect.x - marginIn;
  const right = rect.x + rect.width + marginIn;
  const top = rect.y - marginIn;
  const bottom = rect.y + rect.height + marginIn;
  // Analytic arc/bottom intersections incur a few ulps near the shoulders.
  // This numerical allowance is capped at 1e-9 in, not a physical tolerance.
  const tolerance = Math.min(
    1e-9,
    Number.EPSILON * Math.max(size.width, size.height) * 32,
  );
  if (
    left < -tolerance ||
    right > size.width + tolerance ||
    top < -tolerance ||
    bottom > size.height + tolerance
  ) {
    return false;
  }
  if (profile.kind === "upright-straight") return true;

  const halfWidth = size.width / 2;
  const highestRequiredEdge = capTopAtOffset(
    Math.max(Math.abs(left - halfWidth), Math.abs(right - halfWidth)),
    halfWidth,
    profile.capRiseIn,
  );
  return top + tolerance >= highestRequiredEdge;
}

export function getLayoutGuide(
  size: SizeInches,
  inputProfile: MonumentProfile,
  marginIn = 1,
): LayoutGuide {
  const profile = validateFace(size, inputProfile, marginIn);
  if (2 * marginIn >= Math.min(size.width, size.height))
    return { kind: "empty" };
  if (profile.kind === "upright-straight") {
    return {
      kind: "rectangle",
      rect: {
        x: marginIn,
        y: marginIn,
        width: size.width - 2 * marginIn,
        height: size.height - 2 * marginIn,
      },
    };
  }

  const halfWidth = size.width / 2;
  const rise = profile.capRiseIn;
  const bottom = size.height - marginIn;
  // Solve the upper boundary <= H-m for its horizontal extent. For short
  // bodies or a pure half ellipse the guide can end before the shoulders.
  const q = Math.max(0, (rise - size.height + 2 * marginIn) / rise);
  if (q >= 1) return { kind: "empty" };
  const remainingHalfWidth = halfWidth * Math.sqrt(1 - q * q) - marginIn;
  if (remainingHalfWidth <= 0) return { kind: "empty" };
  const left = Math.max(marginIn, halfWidth - remainingHalfWidth);
  const right = size.width - left;

  return {
    kind: "oval",
    leftIn: left,
    rightIn: right,
    bottomIn: bottom,
    edgeYIn:
      marginIn + capTopAtOffset(halfWidth - left + marginIn, halfWidth, rise),
    centerXIn: halfWidth,
    topYIn: marginIn + capTopAtOffset(marginIn, halfWidth, rise),
    radiusXIn: halfWidth,
    radiusYIn: rise,
  };
}
