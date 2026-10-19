# Design Outputs: Architecture and Boundaries

The designer provides three local outputs: a combined front/side PNG, a PDF design
summary, and a preliminary customer proposal. Editable JSON remains the backup
format. No document-generation service receives design or proposal content.

## One validated source

```text
Validated version-1 design, with no unfinished numeric drafts
                          │
                 detached export snapshot
                          │
             existing geometry + quantity functions
                          │
            shared MonumentDrawing + InscriptionGlyph
                          │
             fresh browser text/layout measurement
                          │
                3840 × 2440 opaque PNG
                          │
               ┌──────────┴───────────┐
               ▼                      ▼
       Design summary PDF     Proposal PDF + optional
                              temporary consultation text
```

`lib/exports/model.ts` validates the existing strict document, copies canonical
inputs, and invokes `createMonumentGeometry` and `calculateNominalVolumes`.
There is no export-specific geometry approximation or pixel-based volume
calculation. The PDF entry point validates again and recomputes derived rows,
so forged cached quantities cannot replace results calculated from dimensions.

## Coordinate transformations

Inches remain authoritative. Inscription `xIn` is the horizontal text center;
`yIn` is the baseline, relative to the tablet's upper-left bounding corner.
`fontSizeIn` is an em-square size, not a manufactured letter height.

The shared preview fitter maps both elevations to a common logical scale in a
`960 × 610` drawing. `lib/exports/raster.tsx` mounts that same renderer in a
temporary, inert, offscreen container; waits for fonts; measures text; serializes
the SVG; and rasterizes it at exactly four pixels per logical drawing unit.
The resulting PNG is `3840 × 2440`, with an opaque warm-white background.
The SVG dimensions, not the screen viewport or expanded-view zoom, determine
the image. Editing handles, selection outlines, and provisional guides are
not included. Demonstration stone styling is retained, not a supplier sample.

The desktop on-screen frame also fits its available stage height using
[CSS container-relative lengths](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length#container_query_length_units).
This display-only constraint prevents expanded sharing controls from cropping
the preview; it does not enter the export snapshot or change the fixed PNG size.

The PDF embeds the PNG at `720 × 457.5 pt` on a landscape US Letter page:
both axes use `0.75 pt` per logical drawing unit. Page coordinates are separate
from monument inches. This preserves proportion but establishes neither a
calibrated paper scale nor a full-size manufacturing drawing.

## Document layout and text

`lib/exports/pdf.ts` uses client-side jsPDF 4.2.1, loaded on demand. The summary
starts with the landscape drawing, followed by portrait specifications,
inscriptions, nominal quantities, and limitations. The proposal adds a
portrait introduction with the optional references, description, notes, and
review notice. Width-aware wrapping handles long words; continuation pages
retain a header, footer, and page count. Input dimensions and positions use
their canonical decimal values. Quantity display is rounded to at most six
decimal places; the underlying equations and stored values are unchanged.

The ordinary reviewed sample uses two summary pages and three proposal pages;
additional wording or review warnings can legitimately add pages. The approval
notice accompanies the drawing, and modeling/material caveats accompany the
quantities, avoiding a redundant mostly-empty disclaimer sheet.

Document prose is searchable text using the locally bundled, unmodified Noto
Sans Regular font. Its source, SHA-256, and SIL Open Font License are recorded
in [the font attribution](../public/fonts/README.md). Monument lettering remains
the browser's existing system-serif rendering inside the raster image. It can
therefore differ slightly between browsers even when anchors and dimensions
are identical. No system font binaries are redistributed.

The PDF writer is not a general text-shaping engine. It checks actual font
glyph coverage and accepts supported BMP Latin, Greek, Cyrillic, and common
characters; unsupported scripts, combining marks, formatting controls, emoji,
and missing glyphs produce a readable failure. Precomposed accented letters
are supported when the font contains them. Text is never silently replaced or
normalized. The canonical design and JSON remain unchanged; PNG can still be
used when the browser can draw and measure that wording. This is a deliberate
current limitation, not universal language support.

## Proposal privacy and validation

All five fields are optional, plain text, and bounded:

| Field | Maximum characters |
| --- | ---: |
| Customer or family reference | 120 |
| Proposal title | 120 |
| Project reference | 80 |
| Design description | 1200 |
| Consultant notes | 3000 |

The strict proposal schema rejects unexpected fields, dangerous structural
keys, accessors, and disallowed controls. React renders text, not arbitrary
HTML; the exporter does not interpret user text as markup. References are
printed only when provided. No fabricated address, telephone number, email,
signature, price, approval seal, or design identifier is inserted.

Proposal text lives only in the open form. Close/Escape clears it; it is not
added to the reducer, local-storage slot, or schema-version-1 document. The PDF
does contain entered text, so users must share downloaded files appropriately.
This is not an encrypted customer-record system. The preparation time is UTC
from the device clock, explicitly labeled as such—not a verified issue date.

## Failure and cancellation guarantees

- Unfinished or invalid dimension/position drafts block output rather than
  silently exporting the last valid preview as if the draft were accepted.
- Fresh text checks block an outside-face or unmeasurable inscription. Text
  that crosses the preliminary margin or overlaps another line stays editable;
  those warnings are included in PDF review notes and download feedback.
  Missing wording is not invented.
- Text bounds are checked against the entire drawing to reject cropped labels,
  including unusually long decimal dimension labels.
- Font/image operations have bounded waits. Temporary DOM, SVG object URLs,
  and canvas buffers are released on success and failure.
- Cancellation invalidates an in-flight proposal. A changed design or newly
  invalid draft invalidates an old snapshot before download. Neither case
  changes canonical state or writes browser storage.
- Feedback says a download **started**; it does not claim the browser retained
  a file. Downloads are not automatic saves or replacements of the local slot.

## Verification boundaries

Unit tests cover canonical snapshots, schemas, shared drawing structure,
independent mathematical references, Unicode failure, pagination, and mutation
resistance. PDF.js is a development-only independent reader for structure,
searchable contents, page bounds, and embedded images. Production-browser tests
decode PNG pixels, compare fixed output across viewport sizes, inspect actual
downloaded PDFs, and exercise cancellation, font failure, keyboard access, and
proposal privacy across available engines. Visual inspection of real PNG/PDF
pages remains separate from structural tests.

Executed software checks are recorded in [VALIDATION.md](VALIDATION.md).
The all-page [export review](EXPORT_REVIEW.md) records inspection of the actual
demonstration outputs.
No PDF/UA accessibility certification, physical print trial, production
approval, or universal browser/font equivalence is implied.
