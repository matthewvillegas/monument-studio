# Accessibility review and acceptance

**October 17–18, 2026.** This is a bounded local engineering review, not a WCAG
conformance certificate or a completed assistive-technology trial. See
[validation](VALIDATION.md) for the final executed browser matrix.

## What the incomplete contrast results mean

The October 18 final browser run produced 39 axe scans with zero violations;
33 scans retained incomplete contrast results. The
report was inspected at the individual-node level. The incomplete results
fall into these groups:

| Reported obstacle | Investigation and disposition |
| --- | --- |
| SVG image/background detection | Projection labels, dimensions and sheet note use `#6c6962` on `#f8f6f1`: 5.07:1. Inch-scaled SVG text sizes confused the automated background/size analysis; review uses the stricter 4.5:1 text threshold. |
| Inscription and selection overlap | Lettering uses `#f2ede4` on code-generated dark stone. The lightest pattern dot composited over the stone, then the 4% selection wash, is bounded above by `#50504c`: at least 6.94:1. This is a conservative source-color calculation, not a claim about every antialiased edge or invalid overlapping design. |
| Non-text check/cross symbols | Valid status `#3f6047` on `#edf3ed`: 6.27:1; invalid status `#942f2f` on `#f8ece9`: 6.71:1. Adjacent words explain the status, so the symbol/color is not the only signal. |
| Firefox cannot parse Tailwind OKLab white/alpha | Header text is white at 55%, 65%, or 80% over `#171715`. Source-over sRGB calculation confirms the lowest-opacity pair exceeds 4.5:1; these are parser limitations, not measured zero contrast. |
| Partial occlusion in scrollable panels or modal descriptions | The affected panel labels/descriptions use `#6c6962` on `#fcfbf8` (5.29:1), or ink `#171715` on that paper. Color pairs pass. Offscreen portions require scrolling; keyboard reachability and screenshot inspection are separate from contrast. No claim that a partially scrolled heading was fully visible during the scan. |

Ratios use linearized sRGB relative luminance and `(Llighter + .05) /
(Ldarker + .05)`. Compare unrounded values; table values are rounded only for
reading. Source colors come from `app/globals.css`, `DesignerHeader`,
`MonumentDrawing`, and `InscriptionGlyph`. This review supplements axe; it does
not suppress or relabel its incomplete records. New themes, text overlays or
rendering changes require another review.

The reference criteria are [W3C text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
and [W3C non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).
Normal text needs 4.5:1; applicable control boundaries and graphical information
need 3:1. The selected text color pairs were checked against 4.5:1 even where
large-text exceptions could apply.

## Correction made

The old input border `#bbb4aa` against `#fffefb` measured **2.04:1**. Borders
that identify editable fields now use `--control-line: #847c70`; shape, size,
inscription, placement and proposal fields share it. Button edges use the same
color. Decorative panel separators retain their original treatment.

The new edge measures 3.98:1 against `#fcfbf8`, 3.72:1 against `#f6f3ed`, and
3.47:1 against `#efebe4`. Existing hover input edges `#918b82` against
`#fffefb` measure 3.35:1. Main focus `#805f34` against paper measures 5.63:1;
the drawing focus `#b58a4d` against the stone base measures 4.72:1. The guide
`#9b8768` against the stone base measures 4.27:1. Small fitted annotations still
need the expanded drawing for comfortable inspection; a contrast pass does
not make tiny text readable.

The final recording also exposed a reduced-motion correctness defect: assigning
a tiny transition duration to every element made SVG font-size changes briefly
animate. Measurement captured the old size, so an oversized line could retain
a false fit message. Reduced motion now disables transitions outright. A real
browser regression failed before the fix, then passed in all three engines;
it checks both the warning and recovery against actual measured text bounds.

## Keyboard and drawing acceptance

The production regression suite exercises these checks with real browser
keyboard events. It does not claim an unaided human completed them.

- [x] Reach the two skip links, controls and drawing using Tab/Shift+Tab.
- [x] Select shape, enter/recover dimensions, edit wording and position text
  without dragging; focus alone does not switch editing mode.
- [x] Reach calculations, save, reopen, download and initiate file import.
  Playwright supplies the file; native file-picker keyboard navigation is not tested.
- [x] Open expanded drawing, fit/enlarge, scroll its detail region, Escape and
  restore opener focus without changing stored inches.
- [x] Reach output actions and proposal fields; Escape/Close returns focus and
  clears optional proposal details.
- [x] Check narrow layouts, doubled CSS text, short viewports, focus visibility,
  reduced motion and supported forced-colors emulation.
- [ ] Perform actual browser-toolbar zoom, touch-device and spoken-reader checks.

Actual browser-toolbar zoom, physical touch-device testing, and spoken
screen-reader testing remain unperformed. No NVDA/Chrome, JAWS/Chrome,
Narrator/Edge or VoiceOver/Safari result is claimed. Browser accessibility
trees and automated keyboard events are not spoken-output evidence.

## PDF and language barriers

Current PDFs are untagged. Searchable prose and successful text extraction do
not provide semantic headings, reliable reading order, table structure or an
accessible alternative for the drawing. **PDF/UA compliance is not claimed.**
For users who depend on assistive technology, review the editable wording and
specifications in the application and arrange an accessible text explanation of
the drawing; do not rely solely on either the PDF or image.

The PDF writer accepts its checked Latin/Greek/Cyrillic repertoire and common
glyphs, including supported precomposed accents. Combining sequences, emoji and
unsupported writing systems fail recoverably; names must never be transliterated
or changed merely to make export succeed. Canonical JSON preserves wording.
PNG may preserve browser-rendered wording but is not an accessible text substitute.
This is material for consultations involving unsupported names/languages and
must be resolved with the user before relying on a PDF handoff. Broader shaping
and properly tagged output are future work informed by actual needs.

See [actual export review](EXPORT_REVIEW.md) for document structure, text and
rendered-page findings. Physical printing and screen-reader/PDF-reader trials
remain pending.

## Human acceptance session still needed

- [ ] Record exact browser, OS, reader/PDF viewer versions and date.
- [ ] Have the participant navigate independently, hear labels/errors/status,
  revise an inscription, review quantities, save/restore and export.
- [ ] Check dialog focus and announcements, expanded drawing description and
  whether numerical/text alternatives communicate the design.
- [ ] Review the PDF reading order and drawing alternatives with the intended
  recipient; document the untagged-file barrier and any agreed accessible handoff.
- [ ] Record observed problems and corrections without identifiable participant
  data. Use the [consultant protocol](USABILITY_TEST_PLAN.md); results are pending.
