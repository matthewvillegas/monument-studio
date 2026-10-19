# Engineering Methods

This document describes the nominal geometric models used by MonumentStudio's
designer and Sprint D outputs. They are models of two ideal, constant-thickness upright
tablets and a rectangular base—not installation, lifting, structural, cemetery,
or manufacturing approval. Material removal, reliefs, polishing allowances,
internal defects, tolerances, foundations, and joints are not modeled.

## 1. Inputs and units

| Symbol | Meaning | Unit |
| --- | --- | --- |
| `W`, `H`, `T` | Tablet width, overall height, thickness | in |
| `R` | Oval cap rise, measured from shoulder to crown | in |
| `Wb`, `Hb`, `Db` | Base width, height, depth | in |
| `A` | Nominal front-profile area | in² |
| `V` | Nominal solid volume | in³ or ft³ |

All canonical dimensions and inscription coordinates are inches. Rendering
coordinates, text measurements, and displayed numerical formatting are derived
representations. Changing viewport size must not change the design.

The six established technical dimension guards remain in force: tablet width
12–120 in, height 12–96 in, thickness 2–24 in; base width 12–144 in, height
2–24 in, depth 4–48 in. Base width must be at least tablet width, and base depth
must be at least tablet thickness. Values must be finite; decimals are allowed.
These bounds prevent pathological prototype inputs, not certify an available
or safe monument.

## 2. Coordinate conventions and projections

The tablet-local origin is the upper-left corner of its bounding rectangle. X
increases to the right; Y increases downward. This origin remains the same for
both profiles, including the empty upper corners of the oval bounding box.

Front tablet and base centers coincide. With validated base width at least
tablet width, the tablet's front X offset is `(Wb − W) / 2`. Its bottom and the
base's top both have `y = H`. In the side elevation the corresponding tablet
offset is `(Db − T) / 2`. The overall height is `H + Hb` in both views.

Both tablet shapes are extruded uniformly through thickness `T`. The side
projection is consequently a `T × H` rectangle: at every height between crown
and base, some part of the front profile reaches that height. This is the
orthographic silhouette, not a claim that every cross-section has full width.

## 3. Straight-top upright

The front profile is the rectangle `0 ≤ x ≤ W`, `0 ≤ y ≤ H`.

```text
Astraight = W H
Vtablet = Astraight T
```

The previously verified straight-top projection implementation is retained.
Adding an oval does not change its centering, contact, or scale conventions.

## 4. Oval-top upright

The front face comprises a rectangular body of height `H − R` and the upper
half of an ellipse with horizontal semi-axis `a = W/2` and vertical semi-axis
`b = R`. The ellipse center is `(a, R)`.

```text
((x − a) / a)² + ((y − R) / R)² = 1   (upper cap: 0 ≤ y ≤ R)

top(x) = R [1 − sqrt(1 − ((x − a) / a)²)]
face: 0 ≤ x ≤ W, top(x) ≤ y ≤ H

Aoval = W(H − R) + ½πab
      = W(H − R) + πWR/4
Vtablet = Aoval T
```

The shoulders are `(0, R)` and `(W, R)`; the crown is `(W/2, 0)`. The ellipse
has vertical tangents at both shoulders, so it joins the body's vertical sides
without a tangent discontinuity when the body has positive height. At `R = H`
the rectangular body has zero height and the face is exactly a half ellipse.

`R` is editable rather than silently derived from width. Its valid range is
`0 < R ≤ H`; zero or negative rise, nonfinite values, and rise above total
height are rejected. This allows different crown proportions without adding a
second hidden model. When a height edit makes the current rise impossible, the
last valid dimensions and profile remain together; no automatic rise clamp is
applied. As `R` approaches zero, the area approaches `WH`, but the exact zero
case remains the straight-top profile rather than a degenerate ellipse.

The renderer uses the same analytic cap parameters as the area and containment
model. Engineering results are never reconstructed from SVG path text, pixel
area, screenshots, or a decorative outline.

## 5. Base and total volume

Both supported tablets sit on a nominal rectangular base:

```text
Vbase = Wb Hb Db
Vtotal = Vtablet + Vbase
Vft³ = Vin³ / 12³ = Vin³ / 1728
```

These are ideal solid volumes. No correction is applied for engraving,
chamfers, surface roughness, cuts, voids, or other removed material. Volume is
not weight. No mass or weight result is displayed because no suitable verified
material-density record has been supplied. The app does not recommend lifting
equipment, foundations, or installation methods.

## 6. Worked reference example

Use a `48 × 30 × 8 in` tablet on a `60 × 8 × 14 in` base. For the oval, set
cap rise to `8 in`. The body height is `22 in`; the half-ellipse semi-axes are
`24 in` and `8 in`.

```text
Aoval = 48(30 − 8) + π × 48 × 8 / 4
      = 1056 + 96π in²
Vtablet = 8(1056 + 96π) = 8448 + 768π in³
Vbase = 60 × 8 × 14 = 6720 in³
Vtotal = 15168 + 768π in³
```

| Result | Straight top | Oval top, R = 8 in |
| --- | ---: | ---: |
| Front-profile area, in² | 1440 | 1357.592895 |
| Tablet volume, in³ | 11520 | 10860.743158 |
| Base volume, in³ | 6720 | 6720 |
| Total volume, in³ | 18240 | 17580.743158 |
| Total volume, ft³ | 10.555556 | 10.174041 |

The table rounds only for readability. Its reference values were independently
derived from the equations above; the implementation is checked against those
values, not against values copied from its own return value.

## 7. Common fitted drawing scale

For each elevation, remove annotation insets from the logical SVG viewport:

```text
sview = min(availableWidth / profileWidth, availableHeight / profileHeight)
s = min(sfront, sside)
renderedPoint = drawingOrigin + s × inchPoint
renderedLength = s × inchLength
```

Each projection is centered in its available region using the same `s`.
`lib/geometry/scaling.ts` performs the conversions;
`lib/geometry/preview.ts` selects the shared scale. Logical SVG drawing units
are not calibrated physical monitor inches or a print scale. The browser may
further scale the whole SVG to fit its CSS container.

## 8. Inscription placement and checks

An inscription stores its horizontal center `xIn`, baseline `yIn`, and
em-square `fontSizeIn` in tablet-local inches. The same coordinates remain in
force when switching profiles or changing dimensions. Centering is an explicit
action (`xIn = W/2`), not an automatic resize side effect. Arrow keys move
0.25 in; Shift+Arrow moves 1 in. Button controls provide a non-drag alternative.

The text lives inside a group translated to the tablet origin and scaled by
`s`. Browser `getBBox()` returns the text's local user-unit rectangle, which is
already expressed in inches. Dividing by the parent scale again would be a
unit error. Measurements are refreshed for the text values and font state that
produced them; stale or absent measurements cannot be treated as a fit result.

For the straight top, text bounds must lie inside the rectangle. For the oval,
the corners of the measured axis-aligned text rectangle must lie inside the
analytic face. Both faces are convex: a rectangle is the convex hull of its
corners, so containing all corners also contains the rectangle. The check is
conservative for actual glyphs because a text box includes empty space between
and around letters.

The provisional one-inch guide uses **axis-aligned square erosion**. A text box
passes the guide check when the rectangle expanded one inch on all four sides
is inside the face. Equivalently, every square of half-width one inch centered
at a point of the text box remains in the face. The displayed guide is derived
from that same rule. It is not obtained by subtracting one inch from both
ellipse radii, and it is not an exact constant-normal-distance offset curve.
Square erosion is conservative relative to a circular one-inch clearance
region, but the margin itself remains unverified product guidance.

Two boxes overlap when their intervals have strictly positive intersection on
both axes. Edge contact alone is not overlap. Text outside a face, crossing a
guide, or overlapping another box remains editable and is reported; it is not
silently moved, deleted, or treated as approved.

## 9. Precision and evidence

Calculations use JavaScript double-precision numbers. Internal dimensions and
areas are not rounded for presentation. Repeated nudge sums are normalized to
`1e-9 in` to suppress accumulation of floating-point noise; this is software
precision handling, not a claimed manufacturing tolerance. Numerical reference
tests use explicit tolerances around analytic expectations, not screenshot
similarity as a substitute for mathematics.

The test inventory, actual command results, browser environment, and unverified
cases are recorded in [VALIDATION.md](VALIDATION.md). Current contracts reside
in `types/profile.ts`; profile validation/construction, guide geometry, and
volume calculations are separated into `lib/validation/profile.ts`,
`lib/geometry/profiles.ts`, `lib/geometry/profile-guide.ts`, and
`lib/engineering/volumes.ts`.

## 10. Applicability boundaries

This model is unsuitable without extension for slants, wedges, bevels, stepped
thickness, compound curves, holes, carving relief, or nonrectangular bases.
For example, a wedge described by a side cross-section requires side area
times width, not this model's front area times thickness. No structural,
stability, stress, fracture, foundation, lifting, transport, cemetery, or
supplier-manufacturability conclusion follows from these calculations.

## 11. PNG and PDF representations

Exports use the same validated profile constructors, volume functions, common
fitter, drawing component, and inscription glyph as the interactive preview.
No export-specific silhouette or quantity equation is derived from pixels.
A detached canonical snapshot prevents asynchronous output from accidentally
mixing old dimensions with new lettering.

The common logical `960 × 610` drawing is rendered to an opaque
`3840 × 2440` PNG: four pixels per logical unit on both axes. A PDF embeds that
image at `720 × 457.5 pt`, again one common scale (`0.75 pt` per logical unit).
These transformations preserve aspect ratios, not a calibrated physical
print scale. Page points, raster pixels, and monument inches remain distinct.

PDF specification and inscription rows retain canonical numeric inputs.
Quantity display rounds to at most six decimal places, while calculations and
saved documents remain unrounded. Area is labeled in square inches; each
tablet/base/total volume has cubic-inch and cubic-foot values using `/1728`.
PDF generation recalculates from the snapshot rather than trusting cached rows.

Fresh browser text measurements determine whether the drawing can be exported
without outside-face lettering or clipped labels. The same profile-aware
checks apply; system-serif metrics can vary by browser and are not physical
engraving dimensions. Margin/overlap warnings are retained as preliminary PDF
review notes, not converted into safety or supplier approval.

Searchable PDF prose uses a separately licensed bundled font. Unsupported or
unreliably shaped text fails explicitly without changing canonical wording.
See [EXPORT_ARCHITECTURE.md](EXPORT_ARCHITECTURE.md) for the supported text
boundary, page layout, validation, and resource-cleanup decisions. Neither a
high-resolution PNG nor a readable PDF establishes structural, installation,
cemetery, or manufacturing suitability.
