# Explaining MonumentStudio's Engineering

MonumentStudio connects a memorial's dimensions, silhouette, lettering, and
preliminary geometric quantities in one browser workspace. Its engineering
methods are parametric modeling, orthographic projection, dimensional analysis,
analytic area and extrusion volume, and explicit geometric constraints.

It is a consultation prototype, not an ordering system or manufacturing approval.
No customer time savings or commercial outcomes have been measured.
[Architecture](architecture.md) describes component ownership;
[engineering methods](ENGINEERING_METHODS.md) provides the full model and
applicability boundaries.

## Physical dimensions remain independent of the screen

A 48-inch tablet remains 48 inches wide when the browser shrinks. Canonical
dimensions use inches; the drawing derives its coordinates from those values.

For tablet width `W`, height `H`, thickness `T`, and base dimensions
`Wb, Hb, Db`, validated inputs require `Wb ≥ W` and `Db ≥ T`.
The tablet's front offset is `(Wb − W)/2`; its side offset is `(Db − T)/2`.
Both components meet at `y = H`, and both views have total height `H + Hb`.

Each view fits within the space remaining after annotation insets:

```text
sview = min(availableWidth / physicalWidth, availableHeight / physicalHeight)
s = min(sfront, sside)
drawingPoint = origin + s × inchPoint
drawingLength = s × inchLength
inchLength = drawingLength / s
```

Using one scale makes an inch equally long in both elevations. Centering the
geometry changes the drawing origin, not the physical inputs. CSS can then
resize the entire SVG without changing the design.

`lib/geometry/scaling.ts` owns these conversions;
`lib/geometry/preview.ts` applies the common fit. SVG provides crisp 2D
elevations without making pixels authoritative geometry. This fitted logical
scale is not a calibrated physical screen or paper scale.

`tests/unit/scaling.test.ts` checks conversions and invalid viewports.
`tests/unit/preview.test.ts` checks common scale, centering, contact, and
minimum/maximum/decimal designs. Browser checks verify that responsive and
expanded-view changes retain inscription coordinates.

## Two profiles share a precise solid model

The straight top is a rectangle. The oval top combines a rectangular body of
height `H − R` with half an ellipse whose semi-axes are `a = W/2` and
`b = R`. Cap rise obeys `0 < R ≤ H`.

```text
ellipse center = (W/2, R)
((x - W/2) / (W/2))² + ((y - R) / R)² = 1

top(x) = R [1 - sqrt(1 - ((x - W/2) / (W/2))²)]
face = { (x, y): 0 ≤ x ≤ W, top(x) ≤ y ≤ H }

Astraight = W H
Aoval = W(H - R) + ½π(W/2)R
      = W(H - R) + πWR/4
```

The crown is `(W/2, 0)`; shoulders are `(0, R)` and `(W, R)`.
The ellipse has vertical shoulder tangents and meets the body's vertical sides
continuously. At `R = H`, the body vanishes and the face is a half ellipse.
As positive rise approaches zero, area approaches `WH`; exact zero belongs to
the separate straight profile.

Both tablets are uniform extrusions through thickness `T`. Their side
projection is therefore the `T × H` envelope. That silhouette does not imply
full front width at every height.

`types/profile.ts` and `lib/validation/profile.ts` define the profile contract.
`lib/geometry/profiles.ts` reuses the same dimensions and cap parameters for
geometry and area. `tests/unit/profiles.test.ts` checks analytic references,
crown/shoulder positions, decimal/extreme values, contact, and common scale.

## Nominal volume follows from area and thickness

For the supported constant-thickness tablet and rectangular base:

```text
Vtablet = Aprofile T
Vbase   = Wb Hb Db
Vtotal  = Vtablet + Vbase
Vft³    = Vin³ / 12³ = Vin³ / 1728
```

These equations have consistent units: square inches multiplied by inches
produce cubic inches. `lib/engineering/volumes.ts` calculates directly from
validated dimensions, never from SVG pixels or screenshot area.

For a `48 × 30 × 8 in` oval tablet with rise `8 in` on a
`60 × 8 × 14 in` base:

```text
Aoval   = 48(30 - 8) + π × 48 × 8 / 4
        = 1056 + 96π in²
Vtablet = 8448 + 768π in³
Vbase   = 6720 in³
Vtotal  = 15168 + 768π in³
        ≈ 17580.743158 in³
        ≈ 10.174041 ft³
```

The corresponding straight-top total is `18240 in³ ≈ 10.555556 ft³`.
`tests/unit/volumes.test.ts` compares implementation results with independently
derived reference expressions and unit conversions.

No density is guessed and no mass or weight is displayed. The model excludes
engraving removal, holes, bevels, joints, tolerances, and fabrication allowances.
A wedge with varying thickness would need a different solid model, such as
side-profile area multiplied by width. These quantities do not establish
lifting, foundation, structural, cemetery, or supplier approval.

## Text placement uses measured geometry

Every inscription stores a horizontal center `xIn`, baseline `yIn`, and
em-square `fontSizeIn` in tablet-local inches. These are not measured glyph
width/height. Position survives profile changes and viewport resizing.

The text group applies `translate(tabletOrigin) scale(s)`, while each text
element keeps its inch-valued attributes. Browser `getBBox()` returns the
local rectangle in those same inch units. Dividing it by the parent scale
again would introduce a unit error.

`components/canvas/inscription-layer.tsx` measures the rendered text.
`lib/inscriptions/layout.ts` checks those measurements rather than estimating
width from character count. A measurement key ties bounds to the exact
inscription state, and font readiness triggers fresh checks. Reduced-motion
styling disables transitions so a font-size change is measured at its current
size. A browser regression exercises enlargement, outside-face warnings, and
recovery in all configured engines.

The straight and oval faces are convex. If all four corners of an axis-aligned
text rectangle are inside the face, the entire rectangle is inside. This is
conservative because a glyph's box includes empty space.

The preliminary one-inch guide expands the box by one inch on all sides before
testing containment. This is axis-aligned square erosion, not an ellipse with
both radii reduced or a true constant-normal-distance offset. It remains
unverified layout guidance.

Two text boxes overlap when their X intervals and Y intervals both have
strictly positive intersection. Edge contact alone is not overlap. Missing
measurements cannot establish a successful fit.

Centering explicitly sets `xIn = W/2`. Arrow keys move by 0.25 in;
Shift+Arrow moves by 1 in; buttons offer a non-drag alternative.
Repeated movement is normalized to `1e-9 in` to limit floating-point noise.
The analytic cap evaluation is rationalized near its crown to reduce
cancellation. Its numerical containment allowance is capped at `1e-9 in`.
Neither numerical choice represents a manufacturing tolerance.

Known-rectangle unit cases cover face/guide crossings, overlap, contact, absent
measurements, and movement. Browser tests supply actual font measurements and
exercise positioning and recovery.

## Draft validity and accepted design values are separate

A temporarily blank or incomplete number must not erase a useful preview.
Dimension and profile drafts remain strings until Zod validates finiteness,
field ranges, `Wb ≥ W`, `Db ≥ T`, and `0 < R ≤ H`.

The reducer in `lib/designer/state.ts` accepts dimensions and profile together.
A height edit that would invalidate oval rise preserves the last valid pair;
it does not silently adjust the rise. Text warnings retain editable content,
while invalid numeric text properties retain their last accepted value.
Unfinished drafts block saving and output so the user cannot mistake a
last-valid preview for the proposed edit.

Reducer tests exercise alternating valid/invalid edits, cross-field recovery,
profile changes, text-position preservation, and explicit centering.
The technical guards protect input integrity; they are not structural equations
or supplier constraints.

## Saving preserves intent rather than a UI session

The strict version-1 document includes profile/rise, tablet/base dimensions, and
three inscription records with content, inch coordinates, and font size. It
does not include pixels, selection, invalid drafts, measured bounds, quantities,
expanded-view state, or proposal notes.

Loading validates the complete document before replacing current work, then
recomputes geometry, quantities, and layout checks. Invalid input cannot partly
replace the model. Unsupported versions, unknown fields, dangerous structural
keys, accessors, and unexpected object shapes are rejected. A 64 KiB UTF-8 limit
bounds file input; no unsupported-version migration is claimed.

One browser-local slot supports deliberate Save/Open actions. JSON Download/
Import provides portable exchange. Replacement confirmation protects current
work and existing saved content. A changed-slot check reduces cross-tab
overwrite risk, but localStorage does not provide atomic compare-and-swap.

Browser-local storage is origin/profile specific and can be erased. It is not
autosave, encrypted customer storage, or cloud backup. See
[PERSISTENCE_SCHEMA.md](PERSISTENCE_SCHEMA.md) for the exact contract and
[architecture's persistence section](architecture.md#persistence) for ownership.
Document, loading, storage, and browser tests cover round trips and failure
recovery.

## Exports describe the same canonical design

An output begins with a validated, detached snapshot. Existing geometry and
volume functions operate on that snapshot. `MonumentDrawing` and
`InscriptionGlyph` serve both interactive and export rendering.

```text
shared logical drawing = 960 × 610
PNG = (960 × 4) × (610 × 4) = 3840 × 2440 pixels
PDF drawing = (960 × 0.75) × (610 × 0.75) = 720 × 457.5 pt
```

Equal-axis scaling preserves proportions. Raster pixels, PDF points, and
monument inches remain distinct; none of these output sizes is a calibrated
paper-to-stone scale. Quantity rows are recomputed from physical inputs.

`lib/exports/raster.tsx` mounts an inert offscreen drawing, waits for fonts,
measures current lettering, checks layout, and creates the PNG.
`lib/exports/pdf.ts` uses client-side jsPDF to combine the drawing with
searchable specifications, inscriptions, quantities, and limitations.
The ordinary sample summary has two pages; its proposal has three. Long text
or warnings may add continuation pages.

Optional bounded proposal text stays in the open form and clears on closing.
It is absent from the saved design but present in the resulting PDF.
Cancellation or a design change prevents an obsolete snapshot from downloading.
Temporary DOM, object URLs, and canvas buffers are released on success/failure.
No external document service receives the content.

Unfinished edits, outside-face or unmeasurable lettering, and cropped labels
block visual output. Margin/overlap warnings can remain and accompany review
notes. The bundled Noto Sans font supports checked simple-script text;
unsupported scripts, combining marks, emoji, and absent glyphs fail explicitly.
Canonical text is not replaced or normalized.

PDF.js tests independently inspect structure, searchable content, bounds, and
embedded images. Browser tests inspect actual PNG/PDF downloads, output
invariance, cancellation, and font/text failures. Visual inspection is separate
evidence because extracted text cannot establish page usability. See
[EXPORT_ARCHITECTURE.md](EXPORT_ARCHITECTURE.md) and
[EXPORT_REVIEW.md](EXPORT_REVIEW.md).

PDFs remain untagged and the drawing is rasterized. Searchable prose does not
establish PDF/UA compliance, spoken screen-reader usability, universal language
support, or physical print quality.

## What verification establishes

Tests check specific mathematical references, state transitions, input
boundaries, rendered interactions, and selected viewport/browser behavior.
[VALIDATION.md](VALIDATION.md) records dated executions, investigated failures,
and unperformed checks. [DEPENDENCY_SECURITY.md](DEPENDENCY_SECURITY.md) records
the dependency-audit findings. [ACCESSIBILITY_ACCEPTANCE.md](ACCESSIBILITY_ACCEPTANCE.md)
separates automated/source-based evidence from pending human acceptance.

These checks do not prove the absence of defects, full accessibility compliance,
real-device coverage, manufacturing suitability, customer acceptance, or
commercial impact.
