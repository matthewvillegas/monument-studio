import { validateDimensionDraft } from "@/lib/validation/dimensions";
import { validateProfile } from "@/lib/validation/profile";
import type { DimensionDraft } from "@/types/design";
import type { MonumentProfile } from "@/types/profile";

/** Validate the entire geometry draft before changing either canonical part. */
export function validateDesignerDraft(
  draft: DimensionDraft,
  profileKind: MonumentProfile["kind"],
  capRiseDraft: string,
) {
  const dimensions = validateDimensionDraft(draft);
  const draftHeight = Number(draft["tablet.height"]);
  // An invalid height has its own field error; it must not cause a thrown profile check.
  const heightForProfile =
    Number.isFinite(draftHeight) && draftHeight > 0 ? draftHeight : 96;
  const profile = validateProfile(
    profileKind === "upright-straight"
      ? { kind: profileKind }
      : {
          kind: profileKind,
          capRiseIn:
            capRiseDraft.trim() === "" ? undefined : Number(capRiseDraft),
        },
    heightForProfile,
  );
  return {
    dimensions,
    profile,
    success: dimensions.success && profile.success,
  };
}
