import {
  parseDesignFile,
  serializeDesignDocument,
  type DesignDocument,
  type DesignFileError,
} from "@/lib/persistence/document";

export const SAVED_DESIGN_KEY = "monumentstudio.saved-design.v1";
export type StorageAccess = () => Pick<Storage, "getItem" | "setItem">;

export type ReadSavedDesignResult =
  | { success: true; document: DesignDocument; raw: string }
  | { success: false; code: "missing" | "unavailable" }
  | { success: false; code: DesignFileError; raw: string };

export type SaveDesignResult =
  | { success: true; document: DesignDocument; raw: string }
  | {
      success: false;
      code: "invalid" | "too-large" | "unavailable" | "capacity" | "conflict";
    };

/** Resolve storage inside the guarded operation: even its getter can throw. */
export function readSavedDesign(access: StorageAccess): ReadSavedDesignResult {
  let raw: string | null;
  try {
    raw = access().getItem(SAVED_DESIGN_KEY);
  } catch {
    return { success: false, code: "unavailable" };
  }
  if (raw === null) return { success: false, code: "missing" };
  const result = parseDesignFile(raw);
  return result.success
    ? { success: true, document: result.document, raw }
    : { success: false, code: result.code, raw };
}

/**
 * expectedRaw identifies the slot content the caller explicitly agreed to
 * replace (null for an empty slot). Recheck immediately before one setItem;
 * failed writes leave the old value intact under the Web Storage contract.
 * This is optimistic conflict detection, not a cross-tab compare-and-swap:
 * localStorage cannot prevent simultaneous writes in the final tiny window.
 */
export function saveDesign(
  access: StorageAccess,
  input: unknown,
  expectedRaw: string | null,
): SaveDesignResult {
  let raw: string;
  try {
    raw = serializeDesignDocument(input);
  } catch {
    return { success: false, code: "invalid" };
  }
  const parsed = parseDesignFile(raw);
  if (!parsed.success) {
    return {
      success: false,
      code: parsed.code === "too-large" ? "too-large" : "invalid",
    };
  }
  try {
    const storage = access();
    if (storage.getItem(SAVED_DESIGN_KEY) !== expectedRaw) {
      return { success: false, code: "conflict" };
    }
    storage.setItem(SAVED_DESIGN_KEY, raw);
    return { success: true, document: parsed.document, raw };
  } catch (error) {
    // DOMException may come from a different window, so avoid instanceof.
    return {
      success: false,
      code:
        typeof error === "object" &&
        error !== null &&
        "name" in error &&
        (error.name === "QuotaExceededError" ||
          error.name === "NS_ERROR_DOM_QUOTA_REACHED")
          ? "capacity"
          : "unavailable",
    };
  }
}
