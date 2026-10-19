"use client";

import { useEffect, useRef, useState } from "react";
import {
  MAX_DESIGN_FILE_BYTES,
  parseDesignFile,
  serializeDesignDocument,
  type DesignDocument,
} from "@/lib/persistence/document";
import { readSavedDesign, saveDesign } from "@/lib/persistence/storage";
import { OutputActions } from "@/components/designer/output-actions";

type PendingAction =
  | { kind: "save"; document: DesignDocument; expectedRaw: string }
  | { kind: "open" | "import"; document: DesignDocument };

const storageAccess = () => window.localStorage;

function storageMessage(code: string): string {
  if (code === "missing")
    return "There isn't a saved design on this browser yet. Choose Save Design to keep your work here.";
  if (code === "capacity")
    return "There isn't enough browser storage to save this design. Your previous save hasn't changed. Try Download Design File instead.";
  if (code === "conflict")
    return "The saved design changed in another tab. Nothing was replaced. Choose Save Design again to review the replacement.";
  if (code === "unavailable")
    return "This browser isn't allowing local storage. Your current design hasn't changed. Try Download Design File instead.";
  if (code === "unsupported")
    return "This saved design uses a file version this app can't open. Your current design hasn't changed.";
  return "We couldn't open the saved design. Your current design hasn't changed. You can import a backup design file instead.";
}

/** Browser-only I/O. The model/schema do not depend on React or localStorage. */
export function DesignActions({
  document,
  canSave,
  hasPendingEdits,
  pendingEditDescription,
  onLoad,
}: {
  document: DesignDocument;
  canSave: boolean;
  hasPendingEdits: boolean;
  pendingEditDescription: string;
  onLoad: (document: DesignDocument) => void;
}) {
  const serialized = serializeDesignDocument(document);
  const [checkpoint, setCheckpoint] = useState(serialized);
  const [savedHere, setSavedHere] = useState(false);
  const [importedUnsaved, setImportedUnsaved] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isError, setIsError] = useState(false);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);
  const replaceButton = useRef<HTMLButtonElement>(null);
  const initiatingButton = useRef<HTMLButtonElement>(null);
  const dirty = serialized !== checkpoint || hasPendingEdits || importedUnsaved;

  useEffect(() => {
    if (!dirty) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [dirty]);

  useEffect(() => {
    if (pending) {
      dialog.current?.showModal();
      cancelButton.current?.focus();
    } else if (dialog.current?.open) {
      dialog.current?.close();
      // Pointer activation does not focus buttons in every browser (notably WebKit).
      // Restore the actual initiating action, not the browser's previous active field.
      initiatingButton.current?.focus();
    }
  }, [pending]);

  function tell(message: string, error = false) {
    setFeedback(message);
    setIsError(error);
  }

  function validForPreservation() {
    if (canSave) return true;
    tell(
      `Apply or correct the unfinished measurements and text position fields before saving or downloading. ${pendingEditDescription} Your last valid preview hasn't changed.`,
      true,
    );
    return false;
  }

  function completeSave(next: DesignDocument, expectedRaw: string | null) {
    const result = saveDesign(storageAccess, next, expectedRaw);
    if (!result.success) {
      tell(storageMessage(result.code), true);
      return;
    }
    setCheckpoint(serializeDesignDocument(result.document));
    setSavedHere(true);
    setImportedUnsaved(false);
    tell("Design saved on this device.");
  }

  function requestSave() {
    if (!validForPreservation()) return;
    const existing = readSavedDesign(storageAccess);
    if (existing.success) {
      if (serializeDesignDocument(existing.document) === serialized) {
        // Still recheck the raw slot before claiming that this design is saved.
        completeSave(document, existing.raw);
      } else {
        setPending({ kind: "save", document, expectedRaw: existing.raw });
      }
    } else if (existing.code === "missing") {
      completeSave(document, null);
    } else if ("raw" in existing) {
      // A corrupt or newer document is data too: never erase it without consent.
      setPending({ kind: "save", document, expectedRaw: existing.raw });
    } else {
      tell(storageMessage(existing.code), true);
    }
  }

  function applyDocument(next: DesignDocument, origin: "open" | "import") {
    onLoad(next);
    if (origin === "open") {
      setCheckpoint(serializeDesignDocument(next));
      setSavedHere(true);
      setImportedUnsaved(false);
      tell("Your design has been restored.");
    } else {
      setSavedHere(false);
      setImportedUnsaved(true);
      tell(
        "Design file imported. Choose Save Design to keep it on this device.",
      );
    }
  }

  function requestOpen() {
    const result = readSavedDesign(storageAccess);
    if (!result.success) {
      tell(storageMessage(result.code), true);
      return;
    }
    if (
      serialized === serializeDesignDocument(result.document) &&
      !hasPendingEdits
    ) {
      applyDocument(result.document, "open");
    } else {
      setPending({ kind: "open", document: result.document });
    }
  }

  async function importFile(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_DESIGN_FILE_BYTES) {
      tell(
        "This design file is too large. Choose a MonumentStudio file smaller than 64 KB. Your current design hasn't changed.",
        true,
      );
      return;
    }
    setBusy(true);
    try {
      const result = parseDesignFile(await file.text());
      if (!result.success) {
        tell(
          result.code === "unsupported"
            ? "This design file uses a version this app can't open. Your current design hasn't changed."
            : "We couldn't open that design file. Your current design hasn't changed.",
          true,
        );
        return;
      }
      // Always confirm asynchronous file reads: edits may have occurred while reading.
      setPending({ kind: "import", document: result.document });
    } catch {
      tell(
        "We couldn't read that design file. Your current design hasn't changed. Please try again.",
        true,
      );
    } finally {
      setBusy(false);
    }
  }

  function downloadFile() {
    if (!validForPreservation()) return;
    let url: string | undefined;
    try {
      const blob = new Blob([serialized], {
        type: "application/json;charset=utf-8",
      });
      url = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = "monumentstudio-design.json";
      window.document.body.appendChild(link);
      try {
        link.click();
      } finally {
        link.remove();
      }
      // Revoking immediately can race the browser's download navigation.
      const allocatedUrl = url;
      window.setTimeout(() => URL.revokeObjectURL(allocatedUrl), 1000);
      tell(
        "Design file download started. Keep the file as a backup; it contains your inscription text.",
      );
    } catch {
      if (url) URL.revokeObjectURL(url);
      tell(
        "We couldn't start the download. Your design hasn't changed. Please try again.",
        true,
      );
    }
  }

  function confirmPending() {
    if (!pending) return;
    if (pending.kind === "save")
      completeSave(pending.document, pending.expectedRaw);
    else applyDocument(pending.document, pending.kind);
    setPending(null);
  }

  return (
    <section className="design-actions" aria-label="Design actions">
      <div className="design-action-row">
        <div className="design-action-buttons">
          <button
            type="button"
            className="quiet-button primary-action"
            disabled={busy}
            onClick={(event) => {
              initiatingButton.current = event.currentTarget;
              requestSave();
            }}
          >
            Save Design
          </button>
          <button
            type="button"
            className="quiet-button"
            disabled={busy}
            onClick={(event) => {
              initiatingButton.current = event.currentTarget;
              requestOpen();
            }}
          >
            Open Saved Design
          </button>
          <button
            type="button"
            className="quiet-button"
            disabled={busy}
            onClick={downloadFile}
          >
            Download Design File
          </button>
          <button
            type="button"
            className="quiet-button"
            disabled={busy}
            onClick={(event) => {
              initiatingButton.current = event.currentTarget;
              fileInput.current?.click();
            }}
          >
            Import Design File
          </button>
          <input
            ref={fileInput}
            aria-label="Design file"
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = ""; // Selecting the same file again must still work.
              void importFile(file);
            }}
          />
        </div>
        <p className="design-save-state" data-testid="save-state">
          {dirty
            ? "Unsaved changes"
            : savedHere
              ? "Saved on this device"
              : "Ready to save"}
        </p>
      </div>
      <p className="storage-note">
        One saved design in this browser on this device. Clearing browser data
        can erase it. Download a file for a backup. No cloud sync.
      </p>
      <p
        className={`save-feedback${isError ? " is-error" : ""}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {busy
          ? "Opening design file…"
          : feedback ||
            "Save your design here, or open a design file to continue working."}
      </p>
      <OutputActions document={document} canExport={canSave} pendingEditDescription={pendingEditDescription} />
      <dialog
        ref={dialog}
        className="design-confirmation"
        aria-labelledby="replace-title"
        aria-describedby="replace-description"
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const first = cancelButton.current;
          const last = replaceButton.current;
          if (event.shiftKey && window.document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (
            !event.shiftKey &&
            window.document.activeElement === last
          ) {
            event.preventDefault();
            first?.focus();
          }
        }}
        onCancel={(event) => {
          event.preventDefault();
          setPending(null);
        }}
      >
        <h2 id="replace-title" className="font-serif text-2xl">
          {pending?.kind === "save"
            ? "Replace saved design?"
            : "Replace current design?"}
        </h2>
        <p id="replace-description">
          {pending?.kind === "save"
            ? "This browser already contains a saved design. Replacing it cannot be undone here. Keep a downloaded backup if you want to retain it."
            : "Opening this design will replace your current measurements, text, and any unfinished edits. Save or download your current work first if you want to keep it."}
        </p>
        <div className="confirmation-buttons">
          <button
            ref={cancelButton}
            type="button"
            className="quiet-button"
            onClick={() => setPending(null)}
          >
            {pending?.kind === "save"
              ? "Keep Saved Design"
              : "Keep Current Design"}
          </button>
          <button
            ref={replaceButton}
            type="button"
            className="quiet-button primary-action"
            onClick={confirmPending}
          >
            {pending?.kind === "save"
              ? "Replace Saved Design"
              : "Replace Current Design"}
          </button>
        </div>
      </dialog>
    </section>
  );
}
