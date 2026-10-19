# Publication inventory and source audit

**Reviewed October 17–18, 2026.** This is a candidate for an owner-approved
initial source import. It is not a release, a legal clearance, or consent to
publish. Executed software checks are recorded in [VALIDATION.md](VALIDATION.md).
The actual Git index defines the proposed import; inspect and count it again
after any file changes.

## Scope and method

The review checks Git's actual staged paths (`git ls-files --cached`) and their
staged contents, then compares them with the working tree. It covers
source/configuration, all Markdown and example data, lockfile and dependency
notices, bundled font/icon, historical screenshots/video, and current exported
samples. Candidate text was screened for credential formats/private keys,
environment files, absolute user paths, credential-bearing URLs, private
records, business pricing/supplier data, and debug output. Application imports,
network/storage/export boundaries, sample values, file sizes, and binary asset
contents were reviewed in addition to pattern matching.

No credentials, customer/employee records, internal prices, supplier contracts,
or machine-specific user paths were identified in the reviewed publication
candidate. This describes the inspection result; pattern scans cannot prove
absence of every possible secret or establish ownership. The business name is
intentional public-facing content and still needs owner approval.

## Disposition

| Material | Decision and reason |
| --- | --- |
| `app/`, `components/`, `lib/`, `types/`, `data/` | Retain the actual 2D implementation. Geometry/validation rules are documented prototype rules, with no proprietary pricing or supplier dataset. |
| `tests/`, configuration, lockfile, `.github/`, `scripts/` | Retain reproducibility and validation tools. Recording scripts use loopback addresses/environment overrides; tool paths and raw captures stay local. |
| README, current engineering/portfolio/release docs | Retain current contracts, equations, factual contributions, executed results and remaining limitations. Architecture, validation, technical explanation and the unreleased changelog describe the current implementation. |
| Historical PNGs in `docs/` and `docs/images/` | Retain genuine iteration evidence. Inspected examples show placeholder VILLEGAS / 190X–200X or fictional NORTH family data, not a claimed customer consultation. |
| `docs/videos/sprint-c-workflow.webm` | Preserve unchanged as the historical Sprint C workflow. It is silent, 76.04 seconds, 1440 × 1000, and 13,651,932 bytes. Its size is intentional evidence, not an accidental cache. |
| Final screenshots/video/captions/capture record | Retain genuine capture of the final application and readable captions. Current provenance and review are in [DEMO_SCRIPT.md](DEMO_SCRIPT.md). No synthetic footage or spoken narration claim. |
| `examples/oval-memorial.design.json` | Retain the reproducible fictional canonical design; no contact record, price, approval, or customer metadata. |
| `output/images/`, `output/pdf/`, `output/designs/` | Retain only deliberately reviewed fictional demonstration exports. These are sample artifacts, not an unrestricted downloads directory. [EXPORT_REVIEW.md](EXPORT_REVIEW.md) records current output inspection. |
| `public/fonts/` | Retain unmodified Noto Sans, provenance, and OFL. Hash and license review are in [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md). |
| `app/icon.svg` | Retain the original source-defined monument icon replacing the Vercel scaffold icon. |
| `public/THIRD_PARTY_NOTICES.txt` | Retain 182 installed license/notice texts with source paths and hashes, including browser dependency notices and conservative server/build notices. |

Earlier example exports remain alongside the separately named final outputs.
All retained demonstration media are genuine and describe their recorded
feature scope; the filenames alone do not imply a public release history.

## Excluded local material

`.gitignore` excludes dependencies, `.next`, `out`, build caches, coverage,
environment files, PEM files, debug logs, Playwright reports/results, Vercel
local configuration, TypeScript build metadata, and `tmp/`. ESLint also ignores
generated report/result/coverage/tmp directories.

`.gitattributes` recognizes Markdown hard line breaks and preserves the collected
upstream notices' original whitespace. Surplus EOF empty lines in existing
source/config/test files were normalized without executable changes. These
settings do not include ignored files or change license wording.

Internal planning, dated development reports, and local tool instructions are
excluded from the public import. Their originals have been preserved unchanged
in a hash-verified private archive outside the Git repository. The public
architecture and validation documents retain genuine technical evidence without
including those internal records.

Raw media, tool binaries, PDF renders, test traces, audit JSON, clean-install
logs, machine-specific notes, and temporary scripts remain outside the index.
Do not force-add private archives or ignored scratch/results directories.

The outer workspace and separate scaffold are outside this Git repository and
must not be accidentally uploaded as the application's root. No copy of
`node_modules`, native dependency binaries, environment file, browser profile,
or source map/build directory belongs in the initial import.

## Source and dependency observations

- No application authentication, API route, remote customer endpoint,
  analytics integration, or external generation service is implemented.
  The application source's explicit `fetch` loads only the same-origin PDF font.
- Canonical design data is bounded and validated before file/storage import.
  React/SVG text rendering carries inscriptions; no application `eval`,
  `dangerouslySetInnerHTML`, credential, or debug-log path was identified.
- Proposal fields are temporary form state. Exported PDFs retain supplied
  wording, so future real consultation exports require a fresh privacy review.
- The five direct runtime dependencies have identified roles: Next.js serving
  and framework build, React/React DOM rendering, Zod validation, and jsPDF
  document generation. Vitest, Playwright, axe, PDF.js, TypeScript, ESLint,
  Tailwind/PostCSS, and types are used by tests/build/checks. No unused direct
  dependency was identified; no package was removed speculatively.
- There is one redistributed font and source-defined gradients/patterns, not a
  commercial stock texture library. Standard system fonts are referenced by
  name rather than copied. Original project software/documentation use the
  selected [MIT License](../LICENSE); third-party terms remain separate and
  neither grants company trademark rights or endorsement.
- The npm registry lockfile is retained for reproducibility. Installed/cache
  contents are excluded. Five high development-package findings remain from
  one advisory; [DEPENDENCY_SECURITY.md](DEPENDENCY_SECURITY.md) explains the
  compatible-fix investigation and remaining exposure.

## Final index review procedure

The final release review stages the reviewed local candidate without committing
it. Confirm the resulting `git ls-files --cached` list agrees with the inventory;
review every binary and changed text with `git diff --cached --numstat`,
`git diff --cached`, and `git diff --cached --check`. Count files and bytes from
the index rather than an unfiltered recursive directory walk.

Recheck suspicious filenames, credential/path patterns, and ignored-directory
prefixes against those staged blobs. Record file count, total staged content
size, largest binaries, working-tree/index differences, commit count, branch,
and remote state. This separates an inspectable source import from an accidental
upload of the whole development workspace.

The current staging snapshot is reviewable local work. Only an explicitly
authorized initial commit, remote/push, deployment, and release can turn it into
a published artifact. Follow [GITHUB_PUBLICATION.md](GITHUB_PUBLICATION.md).
