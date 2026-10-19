# Changelog

## Unreleased

This entry describes the implementation prepared for MonumentStudio's first
public import. No previous public release, tag, or commit sequence is implied.
The package version is `0.1.0`; a proposed `v0.1.0` pre-release requires separate
authorization and the checks in [release readiness](docs/RELEASE_READINESS.md).

### Features

- Parametric straight-top and oval-top upright tablets on a rectangular base,
  with validated inch-based dimensions and a shared front/side drawing scale.
- Analytical face area, tablet/base/total solid volume, and cubic-inch to
  cubic-foot conversion. Results describe nominal geometry, not weight,
  structural safety, manufacturing suitability, or installation approval.
- Three editable inscription lines with center-X/baseline-Y inch coordinates,
  explicit centering, keyboard/button movement, and optional precise placement.
  Browser-measured text bounds support shape-aware face, guide, and overlap
  warnings without silently moving the entered wording.
- A responsive workspace and expanded drawing with keyboard navigation,
  scrolling, focus restoration, reduced-motion treatment, and forced-colors
  styles. Physical-device and spoken screen-reader reviews remain pending.
- Explicit browser-local saving and a strict version-1 portable design format.
  Bounded imports validate the complete document before replacing state;
  invalid data, unfinished edits, and cancelled replacements preserve work.
- Local `3840 × 2440` PNG drawings, searchable PDF summaries, and preliminary
  proposals from detached validated snapshots. Optional proposal details clear
  on closing and are excluded from saved design documents. PDF text uses the
  bundled licensed Noto Sans font; unsupported text fails without substitution.
- Independent mathematical, state, persistence, renderer, and PDF checks;
  production-browser workflow, recovery, responsive, and accessibility tests.
- Actual sample designs, screenshots, captioned demonstration, export review,
  technical explanations, and an unperformed human consultation protocol.
- A locked-install verification workflow and local Markdown link/anchor checker.
- The [MIT License](LICENSE) for original software and associated documentation,
  with retained [third-party notices](public/THIRD_PARTY_NOTICES.txt). Company
  trademarks, branding permissions, and endorsement remain separate matters.

### Corrected behavior

- Reduced motion now disables transitions completely, preventing a font-size
  edit from measuring the previous SVG text size and retaining a false fit
  message. A regression checks the real rendered bounds, warning, and recovery
  in Chromium, Firefox, and WebKit without changing inscription coordinates.
- Editable fields and placement controls have darker identifying borders;
  measured contrast is at least 3.47:1 against their adjacent light surfaces.
- Expanded export controls retain the drawing's aspect ratio in WebKit by
  allowing the grid item to shrink within its assigned height.
- Keyboard focus alone does not retarget inscription placement. Replacement
  cancellation restores the initiating control, and skip links remain reachable
  in WebKit without appearing in scrolled mobile captures when unfocused.
- Narrow and short layouts retain reachable controls and a scrollable expanded
  drawing. Invalid dimension/profile combinations preserve the last valid model.
- Imports reject prototype-related fields, excessive nesting, and invalid
  structures before state replacement. Output generation rejects stale
  snapshots, unavailable measurements, outside-face lettering, and clipped labels.

### Verified status and remaining limits

On October 18, 2026, lint, strict types, 185 unit tests in 16 files, and the
production build passed. The final production-browser suite passed 118 cases
with two intentional screenshot-only skips, zero failures, and zero flaky
results. A separate clean installation passed lint, types, units, and build.
These are dated local results; see [validation](docs/VALIDATION.md) for the
environment, investigated failures, numerical references, and evidence limits.

The production dependency audit reported zero findings. The full audit retained
five high-severity development-package findings from one advisory; the
[dependency review](docs/DEPENDENCY_SECURITY.md) records the unresolved chain.
Automated accessibility checks reported no violations but retained incomplete
contrast results. PDFs are untagged. Human consultation, spoken-reader and
physical-device checks, physical printing, hosted CI, and deployment acceptance
remain unperformed. No public release is represented as completed.
