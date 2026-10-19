"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { PREVIEW_LAYOUT } from "@/lib/geometry/preview";

/** Inspection-only viewport. Neither magnification nor scroll enters design state. */
export function DrawingViewport({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const [enlarged, setEnlarged] = useState(true);
  const [available, setAvailable] = useState<{ width: number; height: number }>(
    PREVIEW_LAYOUT.viewBox,
  );
  const dialogRef = useRef<HTMLDialogElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const helpId = useId();
  const ratio = PREVIEW_LAYOUT.viewBox.width / PREVIEW_LAYOUT.viewBox.height;
  const fittedWidth = Math.max(
    1,
    Math.min(available.width, available.height * ratio),
  );
  const drawingWidth = enlarged
    ? Math.max(PREVIEW_LAYOUT.viewBox.width, fittedWidth * 1.5)
    : fittedWidth;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (expanded) {
      dialog.showModal();
      closeRef.current?.focus();
      const region = scrollRef.current;
      const observer = new ResizeObserver(([entry]) => {
        if (entry) {
          setAvailable({
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          });
        }
      });
      if (region) observer.observe(region);
      return () => observer.disconnect();
    }
    if (dialog.open) {
      dialog.close();
      openerRef.current?.focus();
    }
  }, [expanded]);

  useEffect(() => {
    if (!expanded || !scrollRef.current) return;
    const region = scrollRef.current;
    const front = PREVIEW_LAYOUT.front;
    const frontCenter =
      front.offsetX + (front.viewport.width + front.insets.left - front.insets.right) / 2;
    // A phone should initially reveal the lettering, not just the drawing's left margin.
    region.scrollTo({
      top: 0,
      left: enlarged
        ? Math.max(0, frontCenter * drawingWidth / PREVIEW_LAYOUT.viewBox.width - region.clientWidth / 2)
        : 0,
      behavior: "instant",
    });
  }, [expanded, enlarged, drawingWidth]);

  return (
    <>
      <div className="drawing-view-controls">
        <p>Need a closer look?</p>
        <button
          ref={openerRef}
          type="button"
          className="quiet-button"
          onClick={() => {
            setEnlarged(true);
            setExpanded(true);
          }}
        >
          Expand drawing
        </button>
      </div>
      <div className="drawing-stage">
        <div className="drawing-frame">
          {/* Mount one drawing only: no duplicate SVG IDs or text measurements. */}
          {!expanded && children}
        </div>
      </div>
      <dialog
        ref={dialogRef}
        className="expanded-drawing"
        aria-labelledby={titleId}
        aria-describedby={helpId}
        onCancel={(event) => {
          event.preventDefault();
          setExpanded(false);
        }}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const items = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
              'button:not(:disabled), [tabindex="0"]',
            ),
          );
          const first = items[0];
          const last = items.at(-1);
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
      >
        {expanded && (
          <>
            <div className="expanded-drawing-toolbar">
              <h2 id={titleId}>Expanded drawing</h2>
              <button
                ref={closeRef}
                type="button"
                className="quiet-button"
                onClick={() => setExpanded(false)}
              >
                Close drawing
              </button>
              <div role="group" aria-label="Drawing magnification">
                <button
                  type="button"
                  className="quiet-button"
                  aria-pressed={!enlarged}
                  onClick={() => setEnlarged(false)}
                >
                  Fit drawing
                </button>
                <button
                  type="button"
                  className="quiet-button"
                  aria-pressed={enlarged}
                  onClick={() => setEnlarged(true)}
                >
                  Enlarge drawing
                </button>
              </div>
            </div>
            <p id={helpId} className="drawing-help">
              Scroll or swipe to inspect. With the drawing area focused, arrow
              keys scroll. When text is focused, arrows move that text instead.
              Close to return to your controls.
              Magnification does not change your saved measurements.
            </p>
            <div
              ref={scrollRef}
              className="drawing-detail"
              role="region"
              aria-label="Drawing detail"
              aria-describedby={helpId}
              tabIndex={0}
            >
              <div
                className="drawing-frame expanded-frame"
                style={{ width: drawingWidth }}
              >
                {children}
              </div>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
