import { describe, expect, it, vi } from "vitest";

import { createDesignerState } from "@/lib/designer/state";
import {
  createDesignDocument,
  MAX_DESIGN_FILE_BYTES,
  serializeDesignDocument,
} from "@/lib/persistence/document";
import {
  readSavedDesign,
  saveDesign,
  SAVED_DESIGN_KEY,
  type StorageAccess,
} from "@/lib/persistence/storage";

function memoryStorage(initial: string | null = null) {
  let raw = initial;
  const storage = {
    getItem: vi.fn((key: string) => (key === SAVED_DESIGN_KEY ? raw : null)),
    setItem: vi.fn((key: string, value: string) => {
      if (key !== SAVED_DESIGN_KEY) throw new Error("Unexpected storage key");
      raw = value;
    }),
  };
  return { storage, access: () => storage, current: () => raw };
}

function example() {
  return createDesignDocument({
    ...createDesignerState(),
    profile: { kind: "upright-oval", capRiseIn: 12.125 },
  });
}

describe("explicit browser-local single-slot persistence", () => {
  it("reports a missing slot without creating or mutating browser data", () => {
    const store = memoryStorage();
    expect(readSavedDesign(store.access)).toEqual({
      success: false,
      code: "missing",
    });
    expect(store.storage.getItem).toHaveBeenCalledWith(SAVED_DESIGN_KEY);
    expect(store.storage.setItem).not.toHaveBeenCalled();
  });

  it("saves and recovers the exact complete canonical design", () => {
    const store = memoryStorage();
    const document = example();
    document.inscriptions[0]!.content = "SAVED EXAMPLE";
    document.inscriptions[0]!.xIn = 22.1875;
    const raw = serializeDesignDocument(document);
    expect(saveDesign(store.access, document, null)).toEqual({
      success: true,
      document,
      raw,
    });
    expect(store.storage.setItem).toHaveBeenCalledExactlyOnceWith(
      SAVED_DESIGN_KEY,
      raw,
    );
    expect(readSavedDesign(store.access)).toEqual({
      success: true,
      document,
      raw,
    });
  });

  it("replaces a previous design only when its exact raw value was acknowledged", () => {
    const original = serializeDesignDocument(example());
    const store = memoryStorage(original);
    const next = example();
    next.inscriptions[0]!.content = "NEW EXAMPLE";
    expect(saveDesign(store.access, next, null)).toEqual({
      success: false,
      code: "conflict",
    });
    expect(store.current()).toBe(original);
    expect(store.storage.setItem).not.toHaveBeenCalled();
    expect(saveDesign(store.access, next, original).success).toBe(true);
    expect(readSavedDesign(store.access)).toEqual({
      success: true,
      document: next,
      raw: serializeDesignDocument(next),
    });
  });

  it("detects a changed or removed slot before writing and preserves the newer value", () => {
    const initial = serializeDesignDocument(example());
    const store = memoryStorage(initial);
    const next = example();
    next.dimensions.tablet.height = 32;
    const otherTabRaw = serializeDesignDocument(next);
    store.storage.setItem(SAVED_DESIGN_KEY, otherTabRaw);
    store.storage.setItem.mockClear();
    expect(saveDesign(store.access, example(), initial)).toEqual({
      success: false,
      code: "conflict",
    });
    expect(store.current()).toBe(otherTabRaw);
    expect(store.storage.setItem).not.toHaveBeenCalled();
    expect(saveDesign(memoryStorage().access, example(), initial)).toEqual({
      success: false,
      code: "conflict",
    });
  });

  it("returns corrupt/unsupported/invalid/oversize raw data without erasing it", () => {
    const examples = [
      { raw: "{corrupted", code: "corrupt" },
      {
        raw: JSON.stringify({ ...example(), schemaVersion: 2 }),
        code: "unsupported",
      },
      { raw: JSON.stringify({ ...example(), units: "mm" }), code: "invalid" },
      { raw: " ".repeat(MAX_DESIGN_FILE_BYTES + 1), code: "too-large" },
    ];
    for (const { raw, code } of examples) {
      const store = memoryStorage(raw);
      expect(readSavedDesign(store.access)).toEqual({
        success: false,
        code,
        raw,
      });
      expect(store.current()).toBe(raw);
      expect(store.storage.setItem).not.toHaveBeenCalled();
    }
  });

  it("can replace a corrupt slot only after explicit raw-value acknowledgment", () => {
    const store = memoryStorage("broken data");
    expect(saveDesign(store.access, example(), null)).toEqual({
      success: false,
      code: "conflict",
    });
    expect(saveDesign(store.access, example(), "broken data").success).toBe(
      true,
    );
    expect(readSavedDesign(store.access).success).toBe(true);
  });

  it("does not access storage when the candidate design is invalid", () => {
    const getter = vi.fn<StorageAccess>(() => {
      throw new Error("Must not access storage");
    });
    const invalid = example();
    invalid.profile = { kind: "upright-oval", capRiseIn: 31 };
    expect(saveDesign(getter, invalid, null)).toEqual({
      success: false,
      code: "invalid",
    });
    expect(getter).not.toHaveBeenCalled();
  });

  it("handles a blocked storage getter and blocked read without throwing", () => {
    const blockedGetter: StorageAccess = () => {
      throw new DOMException("Blocked", "SecurityError");
    };
    const blockedRead: StorageAccess = () => ({
      getItem: () => {
        throw new DOMException("Blocked", "SecurityError");
      },
      setItem: vi.fn(),
    });
    for (const access of [blockedGetter, blockedRead]) {
      expect(readSavedDesign(access)).toEqual({
        success: false,
        code: "unavailable",
      });
      expect(saveDesign(access, example(), null)).toEqual({
        success: false,
        code: "unavailable",
      });
    }
  });

  it("reports storage capacity failures while retaining the previous save", () => {
    const original = serializeDesignDocument(example());
    const store = memoryStorage(original);
    const next = example();
    next.inscriptions[0]!.content = "NOT WRITTEN";
    for (const name of ["QuotaExceededError", "NS_ERROR_DOM_QUOTA_REACHED"]) {
      store.storage.setItem.mockImplementation(() => {
        throw new DOMException("Full", name);
      });
      expect(saveDesign(store.access, next, original)).toEqual({
        success: false,
        code: "capacity",
      });
      expect(store.current()).toBe(original);
      expect(readSavedDesign(store.access)).toEqual({
        success: true,
        document: example(),
        raw: original,
      });
    }
  });

  it("reports other failed writes without claiming success or clearing saved work", () => {
    const original = serializeDesignDocument(example());
    const store = memoryStorage(original);
    store.storage.setItem.mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });
    expect(saveDesign(store.access, example(), original)).toEqual({
      success: false,
      code: "unavailable",
    });
    expect(store.current()).toBe(original);
  });
});
