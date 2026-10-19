# Sprint E export review

The Sprint E samples are downloaded from the actual local production application
in a fresh Chromium context. All personal details are fictional. The older
Sprint D examples remain separate historical evidence.

## Reviewed design

The sample is a `48 × 32 × 9 in` oval-top tablet with an `8 in` rise on a
`60 × 8 × 14 in` base. The wording is **NORTH FAMILY**, **1900 — 2000**, and
**A life remembered**. The name was moved up a quarter inch and centered;
its final font size is `2.5 in`. This font size describes an em square, not
the manufactured letter height.

The analytical face area is `48 × (32 − 8) + π × 48 × 8 / 4`, or
`1,453.592895 in²`. Tablet volume is `13,082.336053 in³`; base volume is
`6,720 in³`; total is `19,802.336053 in³`, or `11.459685 ft³`. These values
describe nominal solid geometry. They do not establish weight, material
availability, cemetery acceptance, structural safety, or production approval.

The [portable design](../output/designs/sprint-e-design.json) is the actual
saved document used by the [recorded workflow](DEMO_SCRIPT.md). Its restore
was checked against the original drawing coordinates, inscription anchors,
and displayed quantities before the three files were downloaded.

## Artifacts and inspection

The final samples were generated on October 18, 2026, using Chromium
`156.0.8078.4` against the local production build. The recorder completed all
workflow assertions with no browser console errors or uncaught page errors.

| Artifact | Verified result | Bytes |
| --- | --- | ---: |
| [Design PNG](../output/images/sprint-e-design.png) | `3840 × 2440`; RGBA with every alpha value `255` | 389,929 |
| [Design summary](../output/pdf/sprint-e-design-summary.pdf) | Two pages: landscape drawing, portrait specifications | 203,322 |
| [Customer proposal](../output/pdf/sprint-e-customer-proposal.pdf) | Three pages: portrait introduction, landscape drawing, portrait specifications | 204,619 |
| [Portable design](../output/designs/sprint-e-design.json) | Actual version-1 UI download; byte-identical to the restored browser save | 740 |

Both PDFs were parsed independently with pypdf/pdfplumber and rendered by
Poppler at 150 dpi. Every page was visually inspected: the front and side
drawings, lettering, dimension labels, tables, notes, headers, disclaimers,
and page-number footers are legible, with no observed clipping, overlaps, or
missing glyphs. Landscape pages are `792 × 612 pt`; portrait pages are
`612 × 792 pt`. All extracted characters stay within their page bounds.
The smallest document text is `8 pt`, used for metadata/footer text.

Text extraction confirmed all three inscription lines, `24 in` horizontal
centers, baselines `11.75 / 17.4 / 22.8 in`, font sizes `2.5 / 1.15 / 1 in`,
all dimensions, and the analytical quantities stated above. The proposal
contains the fictional reference and review notes, with no invented price,
contact details, signature, or approval. Its device-clock preparation time
is explicitly labeled UTC.

A separate fresh-context check imported the portable design, used the actual
**Download Design File** control, and compared the downloaded bytes with the
recorded browser save. They match exactly; no runtime errors were collected.

The Noto Sans Type0 font is embedded and has a Unicode mapping. Both files
contain the `3840 × 2440` RGB drawing; decoded embedded-image pixels exactly
match the separate PNG after conversion to RGB. PDF catalog inspection found language
`en-US`, no structure tree or marked-content declaration, no form, no
JavaScript name tree, no catalog/page additional actions, and no script or
external-launch/submission actions. The opening destination is a normal
fit-width page view. These results do not establish tagged-PDF accessibility.

The PNG was also inspected directly: its labels and all three inscription
lines are complete, both elevations have consistent proportions, and the
image includes the preliminary/not-for-production notice. Editing handles
and layout guides are absent from the exported drawing.

Responsive application captures were checked at
[1440 pixels](images/sprint-e-designer-1440.png),
[1024 pixels](images/sprint-e-designer-1024.png), and
[390 pixels](images/sprint-e-designer-390.png). Their saved dimensions are
`1440 × 1000`, `1024 × 2924`, and `390 × 2908` respectively. Controls, drawing,
and final notes remain readable in the intended scrolling layouts. The
recorder also asserted no horizontal page overflow at each width.

### File identity

SHA-256 values identify these reviewed files. Regenerating a PDF may change
its device-clock metadata, so compare the actual artifact rather than expecting
a new export to have the same digest.

| Artifact | SHA-256 |
| --- | --- |
| Sprint E PNG | `c4371318892b625fa318c3704e25d7d679cc8fca9fbc174381b5b369828e3788` |
| Sprint E summary PDF | `168329881c5b701bc35f86db98949147ea5920039b83faf4501ca278fd8fdba0` |
| Sprint E proposal PDF | `84ff696ff44d38fabf9cc9a085c82b3934bcb7b88eaf01a25d67a69d04f21bb6` |
| Sprint E portable design | `a05bb8e8c19aba367809893f1eff6c407fcea0130ad4155861ba28e45a5feacc` |

The preserved Sprint C video and Sprint D PNG/summary/proposal were hashed
before and after this work and remain byte-for-byte unchanged. Rendered review
pages, extracted text, catalog inspection, and sampled video frames are retained
locally under ignored `tmp/pdfs/sprint-e-review/`.

## Accessibility and printing boundaries

PDF body text is searchable text; the diagram and its monument lettering are
embedded as a raster image. A searchable file does not by itself establish
meaningful reading order, diagram alternatives, or screen-reader usability.
No PDF/UA claim is made. The editable application and portable design preserve
the same input data, but they do not replace a human assistive-technology review.

The exporter deliberately rejects unsupported writing systems, combining marks,
emoji, and missing glyphs instead of silently changing text. Precomposed supported
Latin, Greek, and Cyrillic text can be used with the bundled font. Browser PNG
rendering and JSON retention have different text capabilities. Broader text
shaping and tagged PDF output remain future work driven by user needs.

PDF text colors are `#1e1e1c` for primary content and `#53504c` for metadata on
white: relative-luminance ratios are **16.70:1** and **8.02:1**, respectively.
These checks concern those text/color pairs, not an assertion that the whole
document satisfies an accessibility standard. Final spelling, wording,
dimensions, placement, and disclaimers require human approval.

The landscape drawing is placed with an equal scale on both axes, preserving
proportions. It is not a calibrated paper-scale manufacturing drawing. A
nominal-size screen rendering is useful for checking ordinary document layout,
but it does not test a physical printer. **Physical printing remains pending.**
