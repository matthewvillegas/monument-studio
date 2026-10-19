# Release readiness

**October 17–18, 2026.** Local preparation; no public release,
deployment, commit, remote, or tag is implied. The project license decision is
now complete: [MIT](../LICENSE), Copyright (c) 2026 Matthew Villegas.
The detailed evidence is in [VALIDATION.md](VALIDATION.md).

## Local requirements

- Source/disclosure inventory, dependency review, and third-party notices are
  prepared. Current technical documentation and dated demonstration evidence
  define the public package.
- Root MIT text and copyright are confirmed. Third-party notices and the
  bundled font's OFL remain unchanged and govern their respective components.
- README, short portfolio case study, architecture/equations, installation,
  example, contribution disclosure and limitations are documented.
- Control-border contrast is corrected and the scaffold favicon replaced.
- The reduced-motion warning discrepancy found while recording is repaired;
  the regression failed before the change and passed in all three browsers.
- Final lint, strict types, 185 unit tests, production build and 118 browser
  cases passed; two duplicate screenshot-only cases are intentionally skipped.
  All 39 axe scans report zero violations; 33 incomplete contrast scans remain
  recorded alongside source-color calculations and visual/keyboard checks.
- A fresh lockfile install passed final-source lint/types/185 units/build;
  78 application, configuration, test, asset and script files hash-match.
- The genuine 88.56-second captioned demonstration, three responsive captures,
  high-resolution PNG, editable design and every page of both sample PDFs were
  inspected. Historical media/outputs are preserved. See
  [demo](DEMO_SCRIPT.md) and [export review](EXPORT_REVIEW.md).
- All candidate documentation links pass. The reviewed initial source import
  is staged locally; no commit or remote has been created.
- GitHub workflow syntax and the exact hosted/deployment acceptance sequences
  are prepared. Local validation does not establish hosted execution.

## Remaining technical and accessibility limits

- Five high-severity development-package findings trace to the same unpatched
  braces advisory. Production audit has zero reported findings; neither result
  is a guarantee against unknown vulnerabilities. See
  [DEPENDENCY_SECURITY.md](DEPENDENCY_SECURITY.md).
- PDFs are untagged and do not establish PDF/UA compliance. Unsupported writing
  systems/combining text can fail PDF export without changing the design.
  Browser PNG is not an accessible text alternative. See
  [ACCESSIBILITY_ACCEPTANCE.md](ACCESSIBILITY_ACCEPTANCE.md).
- Software verifies ideal geometry and browser layout, not manufacturing,
  engraving clearance, material properties, structural safety or cemetery rules.
- Local saves are browser/origin-specific, one-slot, explicit, and not encrypted
  customer records or cloud backup. Proposal fields are temporary but exported
  documents retain entered text.

## Human evidence still pending

- A real consultant/representative-user session using
  [USABILITY_TEST_PLAN.md](USABILITY_TEST_PLAN.md); no participant outcomes exist.
- Spoken screen-reader/browser and PDF-reader testing, actual browser-toolbar
  zoom, physical touch devices, and ordinary paper printing.
- Owner confirmation of business-name/asset rights, disclosure scope, and the
  factual contribution statement. Product requirements, industry context, and
  portfolio direction are documented; test counts do not establish sole code
  authorship or completed personal review.

## Decisions and external steps requiring the owner

| Decision/action | Concrete prepared material | Current boundary |
| --- | --- | --- |
| Public source plus demo, or public demo with restricted repository | [Publication choices](PUBLICATION_CHECKLIST.md) and [file inventory](PUBLICATION_INVENTORY.md) | Owner chooses visibility/disclosure; a private repository cannot conceal browser-delivered code. |
| Selected MIT license; remaining branding/asset review | [Root MIT license](../LICENSE), [third-party inventory](THIRD_PARTY_LICENSES.md), bundled OFL and notices | MIT is selected for original software/documentation. Third-party terms remain intact; company trademark rights, branding use and endorsement are separate. |
| Honest initial commit and author identity | [Commit subject/body and commands](GITHUB_PUBLICATION.md) | Staging is reviewable preparation. A commit needs explicit authorization. |
| GitHub repository, branch/remote, push | [Publication sequence](GITHUB_PUBLICATION.md) | No remote/account/visibility is assumed. Do not reconstruct sprint commits. |
| Hosted GitHub Actions | [Hosted acceptance checklist](GITHUB_PUBLICATION.md#hosted-workflow-acceptance) | Requires authorized push; retain actual run URL/SHA. No badge until success. |
| External demonstration deployment | [Provider settings and deployed smoke checks](DEPLOYMENT.md) | Approve provider/account/plan/terms and deployment; no public URL is claimed. |
| First public release/tag and media uploads | [Draft v0.1.0 release](GITHUB_PUBLICATION.md#draft-first-release-v010) | Recommend a pre-release; approve the exact verified commit and assets before publishing. |

The sequence is: approve branding/asset rights, disclosure and the contribution
statement; retain the selected MIT license and
third-party notices; review the staged import; authorize/perform the initial
commit; authorize/create the chosen GitHub
repository and push; inspect hosted CI; authorize/deploy and verify the real URL;
then authorize/tag/publish `v0.1.0` with its remaining limitations disclosed.
The detailed commands and stopping points are in the linked publication guide.

Human evidence can remain an explicitly disclosed limitation of a preliminary
portfolio demonstration if the owner accepts that scope. It cannot be presented
as completed usability, accessibility, production or manufacturing acceptance.
