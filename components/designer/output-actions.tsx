"use client";

import { useEffect, useRef, useState } from "react";
import { serializeDesignDocument, type DesignDocument } from "@/lib/persistence/document";
import { proposalDetailsSchema, type ProposalDetails } from "@/lib/exports/proposal";
import { requestDownload } from "@/lib/exports/download";

const emptyProposal = { familyReference: "", title: "", description: "", notes: "", projectReference: "" };
type ProposalField = keyof typeof emptyProposal;
const fields: { key: ProposalField; label: string; maximum: number; multiline?: boolean }[] = [
  { key: "familyReference", label: "Customer or family reference (optional)", maximum: 120 },
  { key: "title", label: "Proposal title (optional)", maximum: 120 },
  { key: "projectReference", label: "Project reference (optional)", maximum: 80 },
  { key: "description", label: "Design description (optional)", maximum: 1200, multiline: true },
  { key: "notes", label: "Consultant notes (optional)", maximum: 3000, multiline: true },
];

/** Proposal information is ephemeral, never passed to the design reducer/storage. */
export function OutputActions({ document: design, canExport, pendingEditDescription }: {
  document: DesignDocument;
  canExport: boolean;
  pendingEditDescription: string;
}) {
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState(false);
  const [proposalOpen, setProposalOpen] = useState(false);
  const [proposal, setProposal] = useState(emptyProposal);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ProposalField, string>>>({});
  const modal = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const firstField = useRef<HTMLInputElement>(null);
  const operation = useRef(0);
  const current = useRef({ design, canExport });
  useEffect(() => { current.current = { design, canExport }; }, [design, canExport]);
  useEffect(() => () => { operation.current += 1; }, []);
  useEffect(() => {
    if (proposalOpen) {
      modal.current?.showModal();
      firstField.current?.focus();
    } else if (modal.current?.open) {
      modal.current.close();
      opener.current?.focus();
    }
  }, [proposalOpen]);

  function tell(message: string, isError = false) { setFeedback(message); setError(isError); }
  function ready() {
    if (current.current.canExport) return true;
    tell(`Apply or correct unfinished measurements and text positions before creating an output. ${pendingEditDescription} Your design has not changed.`, true);
    return false;
  }
  function closeProposal() {
    operation.current += 1; // A cancelled asynchronous generation must not download later.
    setBusy(false);
    setProposalOpen(false);
    setProposal(emptyProposal);
    setFieldErrors({});
    tell("Proposal form closed. Its optional details were cleared; your design has not changed.");
  }

  async function generate(kind: "png" | "pdf" | "proposal", details?: ProposalDetails) {
    if (busy || !ready()) return;
    const ticket = ++operation.current;
    const source = serializeDesignDocument(current.current.design);
    const snapshot: unknown = JSON.parse(source);
    const preparedAt = new Date();
    setBusy(true);
    tell("Preparing your design output…");
    try {
      const { createDesignImage } = await import("@/lib/exports/raster");
      const rendered = await createDesignImage(snapshot);
      let blob = rendered.blob;
      if (kind !== "png") {
        const { buildDesignPdf } = await import("@/lib/exports/pdf");
        const response = await fetch("/fonts/NotoSans-Regular.ttf", { signal: AbortSignal.timeout(20_000) });
        if (!response.ok) throw new Error("Document font unavailable.");
        const fontBytes = new Uint8Array(await response.arrayBuffer());
        if (fontBytes.length > 1_000_000) throw new Error("Unexpected font size.");
        const bytes = buildDesignPdf(rendered.model, new Uint8Array(await blob.arrayBuffer()), {
          fontBytes, preparedAt, layoutWarnings: rendered.warnings,
          ...(details ? { proposal: details } : {}),
        });
        blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      }
      if (ticket !== operation.current) return;
      if (!current.current.canExport || serializeDesignDocument(current.current.design) !== source) {
        tell("Your design changed while the output was being prepared. Please try again to include your latest edits. Nothing was downloaded.", true);
        return;
      }
      requestDownload(blob, kind === "png" ? "monumentstudio-design.png" : kind === "pdf" ? "monumentstudio-design-summary.pdf" : "monumentstudio-customer-proposal.pdf");
      tell(`${kind === "png" ? "Design image" : kind === "pdf" ? "Design PDF" : "Customer proposal"} download started. Check your browser downloads to keep the file.${rendered.warnings.length ? " Review the preliminary text-layout warnings before sharing." : ""}`);
    } catch (cause) {
      if (ticket !== operation.current) return;
      tell(cause instanceof Error && ["DrawingExportError", "PdfTextError"].includes(cause.name)
        ? cause.message
        : "We couldn't create the document. Your design hasn't changed. Please try again.", true);
    } finally {
      if (ticket === operation.current) setBusy(false);
    }
  }

  return <details className="output-actions">
    <summary className="quiet-button">Download &amp; Share</summary>
    <div className="output-panel">
      <p>Share a design preview, or prepare a preliminary proposal. Files are created on this device, without sending your design to a service.</p>
      <div className="output-buttons">
        <button type="button" className="quiet-button" disabled={busy} onClick={() => void generate("png")}>Download Design Image</button>
        <button type="button" className="quiet-button" disabled={busy} onClick={() => void generate("pdf")}>Download Design PDF</button>
        <button type="button" className="quiet-button" disabled={busy} onClick={(event) => {
          opener.current = event.currentTarget;
          if (!ready()) return;
          setProposal(emptyProposal); setFieldErrors({}); setFeedback(""); setProposalOpen(true);
        }}>Create Customer Proposal</button>
      </div>
      <p className="output-note">Image: 3840 × 2440 pixels, front and side views. PDFs are preliminary summaries, not calibrated production drawings. Design files remain the editable backup.</p>
      {!proposalOpen && <p role="status" aria-live="polite" aria-atomic="true" className={`output-feedback${error ? " is-error" : ""}`}>{feedback}</p>}
    </div>
    <dialog ref={modal} className="proposal-dialog" aria-labelledby="proposal-heading" aria-describedby="proposal-privacy"
      onCancel={(event) => { event.preventDefault(); closeProposal(); }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = modal.current?.querySelectorAll<HTMLElement>("input:not(:disabled), textarea:not(:disabled), button:not(:disabled)");
        const first = controls?.[0]; const last = controls?.[controls.length - 1];
        if (event.shiftKey && window.document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && window.document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}>
      <h2 id="proposal-heading">Create Customer Proposal</h2>
      <p id="proposal-privacy">Optional consultation details stay in this form only. Closing it clears them. They are not saved in your design. The PDF will contain what you enter; share it carefully. No contact details are required.</p>
      <form autoComplete="off" onSubmit={(event) => {
        event.preventDefault();
        const parsed = proposalDetailsSchema.safeParse(proposal);
        if (!parsed.success) {
          const errors: Partial<Record<ProposalField, string>> = {};
          for (const issue of parsed.error.issues) { const key = issue.path[0] as ProposalField; if (key in emptyProposal) errors[key] = issue.message; }
          setFieldErrors(errors);
          tell("Review the marked proposal fields before creating the PDF.", true);
          const first = fields.find((field) => errors[field.key]);
          if (first) window.document.getElementById(`proposal-${first.key}`)?.focus();
          return;
        }
        setFieldErrors({}); void generate("proposal", parsed.data);
      }}>
        <div className="proposal-fields">
          {fields.map((field) => <div key={field.key}>
            <label htmlFor={`proposal-${field.key}`}>{field.label}</label>
            {field.multiline
              ? <textarea id={`proposal-${field.key}`} rows={field.key === "notes" ? 5 : 3} maxLength={field.maximum} value={proposal[field.key]} disabled={busy} aria-invalid={Boolean(fieldErrors[field.key])} aria-describedby={fieldErrors[field.key] ? `proposal-error-${field.key}` : undefined} onChange={(event) => setProposal((previous) => ({ ...previous, [field.key]: event.target.value }))} />
              : <input ref={field.key === "familyReference" ? firstField : undefined} id={`proposal-${field.key}`} type="text" maxLength={field.maximum} value={proposal[field.key]} disabled={busy} aria-invalid={Boolean(fieldErrors[field.key])} aria-describedby={fieldErrors[field.key] ? `proposal-error-${field.key}` : undefined} onChange={(event) => setProposal((previous) => ({ ...previous, [field.key]: event.target.value }))} />}
            {fieldErrors[field.key] && <p className="is-error" id={`proposal-error-${field.key}`}>{fieldErrors[field.key]}</p>}
          </div>)}
        </div>
        <p className="output-note">Pricing to be confirmed following design review. This is not a contract, final purchase order, or manufacturing approval.</p>
        <p role="status" aria-live="polite" aria-atomic="true" className={`output-feedback${error ? " is-error" : ""}`}>{feedback}</p>
        <div className="proposal-footer">
          <button type="button" className="quiet-button" onClick={closeProposal}>Close and Clear Details</button>
          <button type="submit" className="quiet-button primary-action" disabled={busy}>Download Customer Proposal</button>
        </div>
      </form>
    </dialog>
  </details>;
}
