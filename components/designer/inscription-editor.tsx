import { INSCRIPTION_LIMITS } from "@/lib/validation/inscriptions";
import type { InscriptionElement, InscriptionId } from "@/types/inscription";

export const INSCRIPTION_LABELS: Record<InscriptionId, string> = {
  name: "Name",
  dates: "Dates",
  epitaph: "Epitaph",
};

export function InscriptionEditor({
  elements,
  selectedId,
  onSelect,
  onChange,
}: {
  elements: InscriptionElement[];
  selectedId: InscriptionId;
  onSelect: (id: InscriptionId) => void;
  onChange: (id: InscriptionId, content: string) => void;
}) {
  return (
    <section className="panel-section" aria-labelledby="inscription-heading">
      <h3 id="inscription-heading" className="panel-section-title">
        Edit inscription
      </h3>
      <p className="my-3 text-xs leading-5 text-[var(--muted)]">
        Edit the wording here. Select a line to adjust its position and size in
        Text Details.
      </p>
      <div className="inscription-editor">
        {elements.map((element) => (
          <div key={element.id}>
            <label htmlFor={`content-${element.id}`}>
              {INSCRIPTION_LABELS[element.id]}
              {element.id === "epitaph" ? " (optional)" : ""}
            </label>
            <input
              id={`content-${element.id}`}
              value={element.content}
              maxLength={INSCRIPTION_LIMITS.contentCharacters[element.id]}
              required={element.id !== "epitaph"}
              aria-invalid={element.id !== "epitaph" && !element.content.trim()}
              aria-describedby={
                element.id !== "epitaph" && !element.content.trim()
                  ? `content-${element.id}-error`
                  : undefined
              }
              onChange={(event) => {
                // Merely tabbing through wording fields must not retarget placement.
                onSelect(element.id);
                onChange(element.id, event.target.value);
              }}
              autoComplete="off"
              placeholder={
                element.id === "epitaph" ? "A life remembered" : undefined
              }
            />
            {element.id !== "epitaph" && !element.content.trim() && (
              <p
                id={`content-${element.id}-error`}
                className="mt-1 text-xs text-[var(--error)]"
              >
                {INSCRIPTION_LABELS[element.id]} inscription is empty.
              </p>
            )}
            <button
              type="button"
              className="position-text-button"
              aria-pressed={selectedId === element.id}
              onClick={() => {
                onSelect(element.id);
                // The selected field remounts on selection; focus after React commits.
                requestAnimationFrame(() =>
                  document.getElementById("position-fontSizeIn")?.focus(),
                );
              }}
            >
              Position {INSCRIPTION_LABELS[element.id].toLowerCase()}
            </button>
          </div>
        ))}
      </div>
      <p className="disclaimer mt-5">
        Single-line text in a system serif font. This is a layout preview, not
        an engraving proof.
      </p>
    </section>
  );
}
