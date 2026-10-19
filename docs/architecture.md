# MonumentStudio Architecture

MonumentStudio is a browser-based, two-dimensional memorial design tool. It
supports straight-top and oval-top upright tablets, a rectangular base, editable
inscriptions, nominal geometric quantities, explicit local saving, portable
design files, and PNG/PDF consultation outputs. This document describes the
implemented system; dated execution evidence is in [VALIDATION.md](VALIDATION.md).

The application does not provide pricing, ordering, authentication, a customer
database, supplier rules, cemetery approval, structural analysis, or 3D modeling.
Demonstration stone styling is not a verified material catalog.

## Application structure

Next.js App Router supplies the application shell. React manages the interactive
workspace; TypeScript describes model contracts; Zod validates inputs; SVG draws
the elevations. Client-side jsPDF is loaded when a PDF is requested. The package
manifest and lockfile record exact installed dependency versions.

```text
Dimension/profile drafts and inscription edits
                       |
              Zod + typed reducer
                       |
          valid canonical design in inches
                       |
          +------------+-------------+
          |                          |
   geometry + quantities     strict version-1 document
          |                          |
   shared SVG drawing        +-------+--------+
          |                  |                |
 browser measurements    local slot / JSON   detached output snapshot
          |                                   |
 preliminary warnings                 shared drawing + fresh checks
                                              |
                                           PNG / PDF
```

| Location | Responsibility |
| --- | --- |
| `app/` | Route, metadata, global styles, responsive presentation |
| `components/designer/` | Editing controls, workspace orchestration, save/import and output actions |
| `components/canvas/` | Shared SVG presentation, measured lettering, expanded drawing |
| `data/` | Demonstration dimensions and visual defaults |
| `types/` | Inch-based dimensions, supported profiles, inscription contracts |
| `lib/designer/` | Draft validation and typed state transitions |
| `lib/validation/` | Dimension, profile, and inscription integrity rules |
| `lib/geometry/` | Projections, scale transforms, analytic profiles, layout guides |
| `lib/engineering/` | Nominal area-derived volume and unit conversion |
| `lib/inscriptions/` | Default positions, movement, containment and overlap checks |
| `lib/persistence/` | Strict document parsing/serialization and local-storage adapter |
| `lib/exports/` | Detached snapshots, rasterization, PDF composition, downloads |
| `tests/unit/`, `tests/e2e/` | Mathematical/state tests and production-browser checks |

Pure geometry has no dependency on the DOM. SVG is suitable for the current
dimensioned 2D views, while physical dimensions remain independent of its
presentation units.

## State boundaries

The workspace uses a local React reducer rather than a global state service.

| State | Treatment |
| --- | --- |
| Valid dimensions, profile, inscription content and inch coordinates | Canonical design; serialized |
| Numeric draft strings and field errors | Editing state; never serialized as accepted design values |
| Selected inscription, current panel, guides, expanded/enlarged view | Temporary presentation state |
| Geometry, area, volume, scale, measured text bounds, layout warnings | Derived and recomputed |
| Optional proposal text | Temporary form state; included only in the requested PDF |

Dimension and cap-rise drafts are validated together. A valid change replaces
dimensions and profile atomically; an invalid draft leaves the last valid
preview available. Reducing tablet height below the current oval rise does not
silently clamp the rise. Inscription numeric drafts likewise preserve the last
valid value until accepted. Save and visual-output actions reject unfinished
numeric edits instead of presenting the underlying preview as the edited result.

Profile changes and resizing preserve inscription anchors. Horizontal centering
and position reset are explicit actions. Import validation succeeds completely
before the reducer replaces the current design.

## Geometry and units

Canonical lengths use inches. Each projection has an upper-left origin, positive
X to the right, and positive Y downward. Inscription coordinates are local to
the tablet's bounding rectangle, including the empty upper corners of an oval.

Let tablet width, overall height, and thickness be `W, H, T`; base width, height,
and depth be `Wb, Hb, Db`; and oval cap rise be `R`.

```text
frontWidth  = max(W, Wb)
frontHeight = H + Hb
frontTablet = ((frontWidth - W) / 2, 0, W, H)
frontBase   = ((frontWidth - Wb) / 2, H, Wb, Hb)

sideWidth   = max(T, Db)
sideHeight  = H + Hb
sideTablet  = ((sideWidth - T) / 2, 0, T, H)
sideBase    = ((sideWidth - Db) / 2, H, Db, Hb)
```

Rectangle tuples are `(x, y, width, height)`. Both components share a horizontal
centerline and contact exactly at `y = H`. The side silhouette is `T × H` for
both supported constant-thickness tablets.

The straight front is a rectangle. The oval front joins a `W × (H − R)`
rectangle to half an ellipse with semi-axes `a = W/2` and `b = R`:

```text
((x - a) / a)² + ((y - R) / R)² = 1       upper cap: 0 ≤ y ≤ R
top(x) = R [1 - sqrt(1 - ((x - a) / a)²)]

Astraight = W H
Aoval     = W(H - R) + πWR/4
Vtablet   = Aprofile T
Vbase     = Wb Hb Db
Vtotal    = Vtablet + Vbase
Vft³      = Vin³ / 1728
```

At `R = H`, the face is a half ellipse. The valid oval domain is `0 < R ≤ H`;
zero rise is represented by the straight profile, not a degenerate ellipse.
Quantities come from physical inputs rather than pixels or sampled SVG paths.

[ENGINEERING_METHODS.md](ENGINEERING_METHODS.md) provides the complete derivation,
reference values, guide construction, numerical precision, and applicability
limits. These are nominal solids: carving, chamfers, joints, tolerances, and
material removal are not modeled. No verified density is supplied, so the
application displays no mass or weight.

## Input integrity

| Dimension | Allowed range |
| --- | --- |
| Tablet width | 12–120 in |
| Tablet height | 12–96 in |
| Tablet thickness | 2–24 in |
| Base width | 12–144 in |
| Base height | 2–24 in |
| Base depth | 4–48 in |

Values must be finite, `Wb ≥ W`, and `Db ≥ T`. Decimals are retained.
Inscription coordinates are bounded to `[-240, 240] in` and font sizes to
`[0.25, 12] in`. The fixed inscription IDs are `name`, `dates`, and `epitaph`;
text is bounded, single-line plain text.

These are software integrity limits, not verified product availability,
engineering tolerances, engraving requirements, or cemetery restrictions.

## Drawing transforms and text checks

Each elevation has a logical viewport with annotation insets. Both use the
smaller fitted scale, so an inch has the same rendered length in each view:

```text
availableWidth  = viewportWidth - leftInset - rightInset
availableHeight = viewportHeight - topInset - bottomInset
sview = min(availableWidth / profileWidth, availableHeight / profileHeight)
s = min(sfront, sside)

originX = leftInset + (availableWidth - profileWidth × s) / 2
originY = topInset + (availableHeight - profileHeight × s) / 2
drawingPoint = origin + s × inchPoint
drawingLength = s × inchLength
inchLength = drawingLength / s
```

Region offsets then place the two projections in the common `960 × 610` SVG.
CSS fits that drawing into the workspace or expanded view. Neither CSS pixels
nor logical drawing units establish a calibrated physical screen/print scale.

Each inscription stores center-X, baseline-Y, and em-square font size in inches.
Its SVG group is translated to the tablet origin and scaled by `s`; local
`getBBox()` measurements are therefore already inches. Measurement keys prevent
old text/position measurements from certifying new content. Font readiness
triggers measurement; reduced-motion styling disables transitions so a
font-size edit is measured at its current size.

Both faces are convex. Containing all four corners of a measured text rectangle
contains the rectangle; this is conservative for actual glyph outlines.
The preliminary one-inch guide expands the text rectangle by one inch on each
side before checking containment. It is axis-aligned square erosion, not a
constant-normal-distance ellipse offset or engraving certification.

Two rectangles overlap only when their intervals have positive intersection on
both axes; touching edges do not count:

```text
overlap =
  first.left < second.right AND first.right > second.left
  AND first.top < second.bottom AND first.bottom > second.top
```

Warnings preserve editable content rather than automatically moving it.
Arrow keys move by 0.25 in, Shift+Arrow by 1 in; direction buttons provide the
same positioning workflow without dragging. Nudge sums are normalized to
`1e-9 in` to limit floating-point accumulation, not to promise a manufacturing
tolerance.

## Persistence

[The version-1 contract](PERSISTENCE_SCHEMA.md) contains the format marker
`monumentstudio-design`, schema version `1`, inch units, profile, dimensions,
and all three inscription records. Derived quantities, measured bounds, drafts,
view state, and proposal details are excluded.

`lib/persistence/document.ts` owns strict parsing and canonical serialization.
It rejects unknown fields, unsupported versions, nonfinite values, malformed
JSON, duplicate/missing inscription IDs, and invalid cross-field values.
An iterative structural guard rejects prototype-related keys, accessors,
non-JSON prototypes, symbols, non-enumerable fields, and cycles without executing
getters. File input is capped at 65,536 UTF-8 bytes. There is no migration from
an undocumented legacy or future format.

`lib/persistence/storage.ts` manages one explicit local slot,
`monumentstudio.saved-design.v1`. Save/Open and JSON Download/Import are separate,
deliberate actions. Replacing current work and replacing an existing save each
require confirmation. Before writing, the adapter checks whether the stored
value changed since confirmation; localStorage has no compare-and-swap
primitive, so a small cross-tab race remains possible.

Storage is browser-profile/origin specific and may disappear when browser data
is cleared. There is no autosave, cloud backup, account, or synchronization.
Local storage and downloaded JSON are not encrypted customer records.
Before-unload prompts are best effort, and download initiation cannot prove
that a file was retained.

## Outputs

A validated, detached canonical snapshot supplies geometry, quantities, and the
shared `MonumentDrawing`/`InscriptionGlyph` renderer. An inert offscreen drawing
waits for fonts and performs fresh layout checks before producing an opaque
`3840 × 2440` PNG. Selection handles and provisional guides are omitted.

The PDF embeds that image at `720 × 457.5 pt`, preserving both axes at
`0.75 pt` per logical drawing unit. Searchable specification and quantity text
uses a bundled, separately licensed Noto Sans font. PDF entry points validate
again and recompute quantities rather than trusting cached rows.

Proposals add five optional bounded text fields held only while the form is
open. Closing clears them; the generated PDF contains any supplied details.
Cancellation or a changed design invalidates an in-flight output before download.
Temporary DOM, image URLs, and canvas resources are released on success/failure.

Outside-face or unmeasurable lettering, cropped labels, and unfinished edits
block visual output. Margin/overlap warnings remain visible in review notes.
The PDF writer rejects unsupported scripts, combining marks, emoji, and missing
glyphs rather than changing canonical text. PDFs are untagged, and the drawing
within them is rasterized. See [EXPORT_ARCHITECTURE.md](EXPORT_ARCHITECTURE.md)
for the full contract and [EXPORT_REVIEW.md](EXPORT_REVIEW.md) for inspected
sample artifacts.

## Accessibility, security, and verification

Labeled controls, field errors, visible focus, keyboard placement, modal
cancellation, focus restoration, live feedback, and scrollable expanded views
support interaction. Browser automation and source-based contrast review do not
establish full WCAG compliance, spoken screen-reader usability, or physical-device
acceptance. [ACCESSIBILITY_ACCEPTANCE.md](ACCESSIBILITY_ACCEPTANCE.md) separates
completed checks from remaining human review.

Design and proposal processing stays in the browser. The PDF font is fetched
from the application's origin; no document-generation service receives the
content. Imported text is not evaluated or injected as HTML. Browser storage
is not a confidential-record system. [DEPENDENCY_SECURITY.md](DEPENDENCY_SECURITY.md)
records dated production/development audit findings and remaining exposure.

Unit tests exercise analytic references, draft/reducer behavior, strict
serialization, local-storage recovery, and output structure. Browser tests
exercise rendering, keyboard interaction, persistence, export downloads,
responsive behavior, and accessibility checks across configured engines.
[VALIDATION.md](VALIDATION.md) records actual executions, investigated failures,
and limitations; a configured workflow is not evidence of a hosted run.

The project's original software and associated documentation use the
[MIT License](../LICENSE). Third-party components retain their own terms in
[THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md) and the distributed notices.
The software license does not grant separate trademark, branding, or endorsement
rights for company identity.
