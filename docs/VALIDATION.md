# Validation Record

**Evidence date: October 18, 2026, America/Chicago.** This document records
executed local checks of the prepared application and the scope of its tests.
The documentation-only publication review did not rerun the application suite;
the results below retain their original execution date. Passing tests do not
establish absence of defects, manufacturing suitability, or human acceptance.

## Executed application checks

The final run used Windows, Node.js 24.16.0, and npm 11.15.0. Playwright started
a fresh production server at `127.0.0.1:3100`, with the configured one worker
and zero local retries. The browser report began at
`2026-10-18T14:31:14.254Z` and recorded a duration of `525.608076` seconds.

| Check | Observed result |
| --- | --- |
| `npm run lint` | Passed, zero warnings |
| `npm run typecheck` | Passed |
| `npm test` | 185 passed in 16 files |
| `npm run build` | Passed |
| `npm run test:e2e` | 118 passed, 2 skipped, 0 unexpected failures, 0 flaky; report errors empty |
| Chromium 156.0.8078.4 | 40 passed |
| Firefox 157.0 | 39 passed, 1 duplicate screenshot-only skip |
| WebKit 27.2 | 39 passed, 1 duplicate screenshot-only skip |
| axe-core 4.13.0 | 39 scans, 0 violations; 33 scans retain incomplete color-contrast checks |
| Clean lockfile installation | Final-source lint, types, 185 unit tests, and build passed |
| `npm audit --omit=dev` | 0 findings, exit 0 |
| `npm audit` | 5 high-severity development-package findings, exit 1 |
| Documentation links | Candidate Markdown targets and anchors passed `node scripts/check-doc-links.mjs` |
| Workflow syntax | actionlint 1.7.12 passed; hosted Actions has not run |
| Recording utilities | Syntax and ESLint checks passed; recorder and encoder executed successfully |
| Local HTTP checks | Application, icon, bundled PDF font, and license notices returned 200 |

The two skips avoid duplicate documentation captures in Firefox and WebKit;
the behavioral cases run in all three engines. Bundled headless WebKit on
Windows is not a test of branded Safari on macOS or iOS. The nonzero full-audit
exit is an unresolved finding, not a passing security gate.

## What the test groups establish

| Group | Checked behavior |
| --- | --- |
| Dimensions and scaling | Finite decimal inputs, inclusive prototype limits, base/tablet guards, uniform fitting, conversions, letterboxing, and invalid viewport rejection |
| Profiles and quantities | Straight/oval bounds, shoulder/crown continuity, allowed rise, shared projections, independent area/volume answers, component sums, and cubic units |
| Inscription layout | Real measured boxes, convex-face and conservative guide containment, overlaps, edge contact, optional blank wording, and missing metrics |
| State integration | Atomic draft validation, last-valid geometry, unchanged text coordinates, explicit centering, movement, and recovery |
| Portable documents | Exact canonical round trips, profiles, decimals/extremes, Unicode/whitespace, strict version/structure rejection, and the 64 KiB UTF-8 limit |
| Browser storage | Save/reopen equality, missing/corrupt data, replacement acknowledgement, changed saved slots, denied reads/writes, quota errors, and previous-save preservation |
| Export snapshots and drawing | Detached validated data, recalculated quantities, shared profile/scale/inscriptions, and removal of editing overlays |
| PNG and PDF output | Actual downloads, image signature/dimensions/decoding, independent PDF parsing, expected pages/fonts/text, quantity references, wrapping, and page bounds |
| Proposal and failure recovery | Bounded optional fields, clearing on close, no persistence-schema change, unavailable fonts, unsupported PDF text, cancelled/stale output, and recoverable alternatives |
| Browser interaction and accessibility | Real SVG measurements and keyboard input, focus recovery, save/import/export lifecycle, responsive layouts, expanded drawing, reduced motion, forced colors, and axe state scans |

Vitest runs the pure mathematical, validation, state, serialization, renderer,
and PDF tests in Node. Browser text geometry is measured with SVG `getBBox()`;
a character-count approximation is not treated as equivalent evidence.
Playwright checks console errors and uncaught page exceptions alongside the
asserted behavior.

Browser geometry tests also query native SVG `isPointInFill()`. Independently
derived probes at a 10-inch oval rise straddle the face boundary at `(9.6, 2)`
and square-clearance guide boundary at `(10.6, 3)`. Expected results do not call
the production containment function. These probes connect analytical geometry
to the actual rendered paths.

## Independent numerical references

For a `48 × 30 × 8 in` tablet on a `60 × 8 × 14 in` base:

```text
Straight area = 48 × 30 = 1440 in²
Straight tablet volume = 1440 × 8 = 11520 in³
Base volume = 60 × 8 × 14 = 6720 in³
Straight total = 18240 in³ = 10.555555555555555 ft³

Oval R = 8 in:
area = 48 × 22 + ½π × 24 × 8 = 1056 + 96π in²
tablet = 8448 + 768π in³
total = 15168 + 768π in³ = 10.17404117937324 ft³
```

Reference answers are independently derived from the equations in
[engineering methods](ENGINEERING_METHODS.md), rather than produced by the
function under test. Comparisons include the `R = H` half-ellipse endpoint and
the approach toward rectangular area as rise decreases. Floating-point
tolerances concern computation; they are not manufacturing tolerances.
Presentation rounding is checked separately from full-precision quantities.

Independent shared-scale expectations are `402/14` drawing units/in for the
minimum design, `142/48` for the maximum, and `540/47.75` for a decimal design.
That decimal design uses tablet `40.5 × 28.25 × 7.5` and base
`47.75 × 7.25 × 10.125`; front and side tablet offsets are `3.625` and `1.3125`
in respectively.

The persistence browser lifecycle uses a separate `54.5 × 34.25 × 9.25 in`
oval tablet, rise `11.75 in`, and `64.25 × 9.5 × 16.25 in` base. It compares the
actual downloaded JSON with an explicit expected document, calculates quantities
independently, and checks restored geometry and display values. A round trip
alone would not establish mathematical correctness.

Import regressions include an own `__proto__` field, 10,000 nested arrays under
the byte limit, cycles, and accessor objects whose getters must not execute.
The explicit structural guard addresses cases that schema validation alone
did not reject. UTF-8 byte length, rather than JavaScript string length,
enforces the import limit. Markup-like inscription content remains literal text.

## Investigated failures and regression evidence

### Replacement-dialog timeout

An initial three-worker check returned **114 passed, 2 skipped, and 1 WebKit
timeout** in 312.758 seconds while waiting for the “Replace Saved Design” button
to become actionable. It was not a failed assertion that saved data was
corrupted. The unchanged isolated test passed in 8.5 seconds, with a 4.3-second
test body. A resource/timing cause is plausible but was not proven.

A subsequent one-worker full run passed 115 cases with two skips and zero
failed/flaky results in 457.520 seconds. Both results predate the warning repair
below; neither is substituted for the final 118-pass run.

### Reduced-motion inscription measurement

The actual recording workflow exposed a correctness defect: a universal
`0.01ms` transition duration activated otherwise static SVG font-size
transitions. After an edit from 2.5 to 8 inches, synchronous and font-ready
measurements still read the previous size. The name ultimately measured about
61.80 inches wide on a 48-inch face, while the panel retained a false fit result.

Reduced motion now uses `transition: none`, keeping measurement and rendering
in agreement without changing geometry, coordinates, or the persistence schema.
The regression follows the oval/edit/nudge/center/resize sequence, independently
checks that the real SVG box exceeds the face, requires the warning, and then
checks recovery at 2.5 inches without moving the text. It failed against the
old CSS and passed in all three engines after the repair: three tests in
18.7 seconds. Those three cases also passed in the complete final run.

### Other checked corrections

- A WebKit frame aspect-ratio failure was traced to a grid item's automatic
  minimum. `min-height: 0` corrected presentation without changing geometry;
  the targeted check and subsequent complete browser suite passed.
- Keyboard focus on wording fields previously retargeted placement, and WebKit
  cancellation could restore an earlier field. Tests now require selection on
  editing and restoration of the actual initiating control.
- Narrow/short-view checks cover a 320 × 256 viewport, wrapping with doubled
  CSS text, reachable skip links, and clipping of unfocused skip links in
  scrolled captures. CSS text enlargement is not browser-toolbar zoom.
- The control-border review found `#bbb4aa` against `#fffefb` at 2.04:1.
  Identifying borders now use `#847c70`, measuring at least 3.47:1 against the
  relevant light surfaces. This correction does not establish full conformance.

## Clean installation

A separate source copy installed the existing lockfile with `npm ci`:
422 packages installed, 423 audited, in 43 seconds. Following final application
synchronization, lint, types, all 185 unit tests, and build passed there.
SHA-256 comparison of 78 application, configuration, test, asset, and script
files matched the working tree, including the separately executed and
syntax/lint-checked caption encoder. Formatting-only EOF cleanup was also
synchronized. The manifest and lockfile matched; the lockfile SHA-256 was:

```text
FF3DA3B4E15DDA78E133457941795FD802600D3FBC016356D2D25B670AB02A1F
```

The copy reused neither installed dependencies nor build output. This is
Windows clean-install evidence. It does not establish a successful Ubuntu
hosted workflow, and it does not claim that later documentation revisions were
part of the application test execution.

## Accessibility and responsive evidence

The final suite produced 39 axe scans with zero reported violations. Incomplete
color-contrast checks remain in 33 scans because of SVG/background analysis,
overlap, non-text status symbols, Firefox color parsing, or partially scrolled
content. Source-color calculations using linearized sRGB supplement those
records; incomplete findings have not been relabeled as passes. The detailed
ratios and acceptance boundaries are in
[accessibility review](ACCESSIBILITY_ACCEPTANCE.md).

Real keyboard events cover skip links, editing, positioning, save/reopen,
replacement cancellation, output actions, proposal controls, expanded drawing,
Escape, and focus restoration. Playwright supplies the selected import file;
manual navigation of the operating system's native file picker is not covered.
Responsive checks include 1440, 1024, 982, 390, and 320 CSS-pixel widths,
short views, and doubled CSS text. Reduced-motion and forced-colors emulation
are browser settings, not evidence from physical devices or operating-system
accessibility controls.

Observed SVG metrics illustrate why text must be remeasured rather than saved
as a fixed box. With `FAMILY NAME`, a 2.5-inch font size, and a 1440 × 1000
viewport, the same system-serif stack produced:

| Headless engine | Width (in) | Height (in) |
| --- | ---: | ---: |
| Chromium 156.0.8078.4 | 18.064138 | 3.402179 |
| Firefox 157.0 | 17.894825 | 3.402238 |
| WebKit 27.2 | 17.906250 | 3.421875 |

These observations were recorded before the final release check; they are not
a new measurement from the documentation review. The presentation is rounded;
canonical center-X `24` and baseline-Y `12` remained unchanged. Browser metrics
do not establish manufactured letter dimensions. Mobile's fitted drawing is
small; its expanded view supports closer inspection.

## Actual demonstration and output review

The [88.56-second demonstration](DEMO_SCRIPT.md) records the running production
application with fictional wording, 11 captions, and no audio. Real workflow
assertions cover warning/recovery, independent quantities, save/restore equality,
downloaded files, and a separate portable-file import. The complete video
decoded without errors; sampled visual review included its closing frame.
No human usability result or spoken narration is implied.

The [export review](EXPORT_REVIEW.md) records the inspected PNG, portable design,
two-page summary, three-page proposal, and file hashes. All five PDF pages were
rendered and visually inspected. Extracted characters stayed within page bounds;
both embedded drawings matched the separate PNG's decoded RGB pixels. Actual
1440/1024/390-pixel captures were checked visually and for horizontal page
overflow. Retained earlier media and sample exports were not overwritten.

Export tests also check that a saved/restored design preserves JSON, drawing
coordinates, and PNG bytes within an engine. Independently parsed PDFs retain
the expected text, specifications, and image counts, excluding fresh timestamp
metadata. Cross-browser font pixels are not assumed identical.

## Security findings and remaining acceptance work

The October 18 production audit reported zero known findings. The full audit
reported five high-severity package findings in one development-only chain:
`braces → micromatch → fast-glob → @next/eslint-plugin-next → eslint-config-next`.
No compatible patched chain was identified at review time; the incompatible
major downgrade suggested by npm was not applied. Exposure, safeguards, and
the remaining risk are documented in
[dependency security](DEPENDENCY_SECURITY.md). Zero production findings is not
a vulnerability-free claim or penetration-test result.

The [verification workflow](../.github/workflows/verification.yml) is prepared
with pinned actions, read-only repository permission, locked installation,
provisioned browser engines, quality checks, and visible audit results.
Hosted GitHub Actions and deployment acceptance remain unperformed.

The following evidence is still missing:

- A completed human consultation using the [study protocol](USABILITY_TEST_PLAN.md).
- Spoken screen-reader/browser and screen-reader/PDF-reader reviews, actual
  browser-toolbar zoom, and physical touch-device checks.
- Tagged PDF structure, reliable reading order, and PDF/UA validation. Current
  PDFs embed the drawing as an image; searchable prose is not semantic access.
- Broader PDF text shaping. Unsupported scripts, combining sequences, and emoji
  fail recoverably without changing the entered name or wording.
- Physical printing and confirmation of final wording, dimensions, placement,
  and usable handoff documents by the intended recipient.
- Manufacturing, material, stress, stability, lifting, transport, foundation,
  cemetery, or installation assessment; nominal geometry supplies none of these.
- An actual hosted CI run and verification of an authorized deployed URL.

See [release readiness](RELEASE_READINESS.md) for publication decisions. These
limits remain visible even when every implemented-feature test passes.

## Reproduce the software checks

From the repository directory with Node.js 24.16.0 and npm 11.15.0:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium firefox webkit
npm run test:e2e
node scripts/check-doc-links.mjs
npm audit --omit=dev
npm audit
```

Port 3100 must be free. The default browser command starts the production build
and does not reuse an existing server. On Linux, provision browser libraries
with `npx playwright install --with-deps chromium firefox webkit`. Browser
reports and traces are generated under ignored local output directories. Run
results should be recorded with their real environment and date; the historical
numbers above must not be reused as evidence for changed application code.
