# Third-party rights and license inventory

**Dependency snapshot: October 17, 2026; current package-lock.json.**
MonumentStudio's original software and associated documentation use the
[MIT License](../LICENSE), Copyright (c) 2026 Matthew Villegas. The dependency
inventory below retains its review date and respective third-party terms.
Software permissions do not grant company trademark rights, branding use, or
endorsement; publication of the business identity and supplied assets requires
separate owner review.

## Bundled font and artwork

Noto Sans Regular is the only redistributed font file. Its SHA-256 was checked
against [the pinned provenance record](../public/fonts/README.md), with exact
match `b85c38ecea8a7cfb39c24e395a4007474fa5a4fc864f6ee33309eb4948d232d5`.
Keep [the supplied OFL](../public/fonts/OFL.txt) and copyright statement beside
it. The font remains unmodified. OFL permits embedding without licensing the
resulting document under OFL; review its conditions for redistribution or font
changes. See the [OFL FAQ](https://openfontlicense.org/ofl-faq/).

Browser lettering uses system fonts without copying their files. Stone fills
are source-defined gradients/patterns, and screenshots show the running
application. There is no supplied commercial texture/artwork library. The
application icon is an original simple monument SVG. The owner must still
approve public use of the business identity and confirm rights to the work.

## Notices prepared locally

[THIRD_PARTY_NOTICES.txt](../public/THIRD_PARTY_NOTICES.txt) preserves 182 unabridged
license/notice texts from installed non-development lockfile entries and
Next.js's vendored `dist/compiled` packages. Each section records its installed
source path and SHA-256 of the original installed file; collection line endings
and surrounding blank lines are normalized. All 182 source hashes and notice
bodies were checked against the installed files. It is a conservative collection: some entries are
server/build/optional dependencies and do not enter the browser bundle. At a
root-hosted demonstration it is served at `/THIRD_PARTY_NOTICES.txt`; the font
license is served at `/fonts/OFL.txt`. Keep both in the deployment.

Three installed packages ship no separate root license file: `@next/env`,
`@next/swc-win32-x64-msvc`, and `client-only`. Their package metadata declares
MIT; the collection includes the installed Next.js and React project license
texts, but does not manufacture missing package notices. Before redistributing
native binaries, containers, or a packaged application, inspect that exact
artifact's supplier notices and corresponding-source requirements. The source
repository does not include `node_modules` or native dependency binaries.

The lockfile has 81 non-`dev` package entries; 48 are installed on this Windows
host. Optional peers can make development tools such as Playwright appear in
that set. This list is intentionally broader than the five direct runtime
dependencies or the JavaScript actually delivered to a browser. Platform-specific
entries absent here must be reviewed on the chosen target; Windows metadata is
not proof of a Linux deployment's complete notices.

## Conditions requiring attention

- The direct runtime libraries Next.js, React, React DOM, Zod, and jsPDF declare
  MIT. Preserve their copyright/permission notices when distributing copies or
  substantial portions; bundled dependency notices matter as well.
- jsPDF's optional DOMPurify dependency offers MPL-2.0 or Apache-2.0. The exact
  installed license text is retained, including the MPL alternative. Other
  transitives include pako (MIT and Zlib), caniuse-lite (CC-BY-4.0), and common
  MIT/ISC/BSD/Apache packages. Do not relabel all dependencies as MIT.
- Sharp is Apache-2.0 and its prebuilt libvips components include LGPL-3.0-or-later.
  Next.js brings this server-side dependency even though this app has no
  `next/image` usage. Merely publishing a lockfile is different from conveying
  those binaries. Review the actual deployment/distribution form before shipping
  native binaries; retaining this notice file alone does not satisfy every
  possible corresponding-source/relinking obligation. See
  [Sharp's licensing guidance](https://sharp.pixelplumbing.com/#licensing).
- PDF.js and Playwright are development/test dependencies under Apache-2.0;
  axe-core and Lightning CSS include MPL-2.0 terms. They are not imported by
  application code. Do not redistribute test tools, browser installers, or
  generated Playwright reports as public sample assets without their notices.

Primary license texts are supplied by the installed packages; upstream references
include [jsPDF](https://github.com/parallax/jsPDF/blob/master/LICENSE) and
[DOMPurify](https://github.com/cure53/DOMPurify/blob/main/LICENSE). This inventory
records evidence and outstanding distribution checks. It does not replace the
project MIT License, alter third-party terms, or establish blanket legal clearance.

## Resolved non-development lockfile entries

Generated from `package-lock.json` entries without `dev: true`, verified against
local package directories. `platform optional` means absent on this host, not
unused on every deployment. Preserve exact license expressions.

| Package / lockfile location | Version | Declared license | Local scope |
| --- | --- | --- | --- |
| `@babel/runtime` | 7.29.10 | MIT | installed |
| `@emnapi/runtime` | 1.11.3 | MIT | platform optional |
| `@img/colour` | 1.1.0 | MIT | installed |
| `@img/sharp-darwin-arm64` | 0.35.5 | Apache-2.0 | platform optional |
| `@img/sharp-darwin-x64` | 0.35.5 | Apache-2.0 | platform optional |
| `@img/sharp-freebsd-wasm32` | 0.35.5 | Apache-2.0 | platform optional |
| `@img/sharp-libvips-darwin-arm64` | 1.3.4 | LGPL-3.0-or-later | platform optional |
| `@img/sharp-libvips-darwin-x64` | 1.3.4 | LGPL-3.0-or-later | platform optional |
| `@img/sharp-libvips-linux-arm` | 1.3.4 | LGPL-3.0-or-later | platform optional |
| `@img/sharp-libvips-linux-arm64` | 1.3.4 | LGPL-3.0-or-later | platform optional |
| `@img/sharp-libvips-linux-ppc64` | 1.3.4 | LGPL-3.0-or-later | platform optional |
| `@img/sharp-libvips-linux-riscv64` | 1.3.4 | LGPL-3.0-or-later | platform optional |
| `@img/sharp-libvips-linux-s390x` | 1.3.4 | LGPL-3.0-or-later | platform optional |
| `@img/sharp-libvips-linux-x64` | 1.3.4 | LGPL-3.0-or-later | platform optional |
| `@img/sharp-libvips-linuxmusl-arm64` | 1.3.4 | LGPL-3.0-or-later | platform optional |
| `@img/sharp-libvips-linuxmusl-x64` | 1.3.4 | LGPL-3.0-or-later | platform optional |
| `@img/sharp-linux-arm` | 0.35.5 | Apache-2.0 | platform optional |
| `@img/sharp-linux-arm64` | 0.35.5 | Apache-2.0 | platform optional |
| `@img/sharp-linux-ppc64` | 0.35.5 | Apache-2.0 | platform optional |
| `@img/sharp-linux-riscv64` | 0.35.5 | Apache-2.0 | platform optional |
| `@img/sharp-linux-s390x` | 0.35.5 | Apache-2.0 | platform optional |
| `@img/sharp-linux-x64` | 0.35.5 | Apache-2.0 | platform optional |
| `@img/sharp-linuxmusl-arm64` | 0.35.5 | Apache-2.0 | platform optional |
| `@img/sharp-linuxmusl-x64` | 0.35.5 | Apache-2.0 | platform optional |
| `@img/sharp-wasm32` | 0.35.5 | Apache-2.0 AND LGPL-3.0-or-later AND MIT | platform optional |
| `@img/sharp-webcontainers-wasm32` | 0.35.5 | Apache-2.0 | platform optional |
| `@img/sharp-win32-arm64` | 0.35.5 | Apache-2.0 AND LGPL-3.0-or-later | platform optional |
| `@img/sharp-win32-ia32` | 0.35.5 | Apache-2.0 AND LGPL-3.0-or-later | platform optional |
| `@img/sharp-win32-x64` | 0.35.5 | Apache-2.0 AND LGPL-3.0-or-later | installed |
| `@next/env` | 16.4.0 | MIT | installed |
| `@next/swc-darwin-arm64` | 16.4.0 | MIT | platform optional |
| `@next/swc-darwin-x64` | 16.4.0 | MIT | platform optional |
| `@next/swc-linux-arm64-gnu` | 16.4.0 | MIT | platform optional |
| `@next/swc-linux-arm64-musl` | 16.4.0 | MIT | platform optional |
| `@next/swc-linux-x64-gnu` | 16.4.0 | MIT | platform optional |
| `@next/swc-linux-x64-musl` | 16.4.0 | MIT | platform optional |
| `@next/swc-win32-arm64-msvc` | 16.4.0 | MIT | platform optional |
| `@next/swc-win32-x64-msvc` | 16.4.0 | MIT | installed |
| `@playwright/test` | 1.64.0 | Apache-2.0 | installed |
| `@swc/helpers` | 0.5.23 | Apache-2.0 | installed |
| `@types/pako` | 2.0.4 | MIT | installed |
| `@types/raf` | 3.4.3 | MIT | installed |
| `@types/trusted-types` | 2.0.7 | MIT | installed |
| `base64-arraybuffer` | 1.0.2 | MIT | installed |
| `baseline-browser-mapping` | 2.11.10 | Apache-2.0 | installed |
| `caniuse-lite` | 1.0.30001806 | CC-BY-4.0 | installed |
| `canvg` | 3.0.11 | MIT | installed |
| `client-only` | 0.0.1 | MIT | installed |
| `core-js` | 3.50.0 | MIT | installed |
| `css-line-break` | 2.1.0 | MIT | installed |
| `detect-libc` | 2.1.2 | Apache-2.0 | installed |
| `dompurify` | 3.4.17 | (MPL-2.0 OR Apache-2.0) | installed |
| `fast-png` | 6.4.0 | MIT | installed |
| `fflate` | 0.8.3 | MIT | installed |
| `html2canvas` | 1.4.1 | MIT | installed |
| `iobuffer` | 5.4.0 | MIT | installed |
| `jspdf` | 4.2.1 | MIT | installed |
| `nanoid` | 3.3.20 | MIT | installed |
| `next` | 16.4.0 | MIT | installed |
| `next/node_modules/postcss` | 8.5.23 | MIT | installed |
| `pako` | 2.2.0 | (MIT AND Zlib) | installed |
| `performance-now` | 2.1.0 | MIT | installed |
| `picocolors` | 1.1.1 | ISC | installed |
| `playwright` | 1.64.0 | Apache-2.0 | installed |
| `playwright-core` | 1.64.0 | Apache-2.0 | installed |
| `raf` | 3.4.1 | MIT | installed |
| `react` | 19.2.4 | MIT | installed |
| `react-dom` | 19.2.4 | MIT | installed |
| `regenerator-runtime` | 0.13.11 | MIT | installed |
| `rgbcolor` | 1.0.1 | MIT OR SEE LICENSE IN FEEL-FREE.md | installed |
| `scheduler` | 0.27.0 | MIT | installed |
| `sharp` | 0.35.5 | Apache-2.0 | installed |
| `sharp/node_modules/semver` | 7.8.5 | ISC | installed |
| `source-map-js` | 1.2.2 | BSD-3-Clause | installed |
| `stackblur-canvas` | 2.7.0 | MIT | installed |
| `styled-jsx` | 5.1.6 | MIT | installed |
| `svg-pathdata` | 6.0.3 | MIT | installed |
| `text-segmentation` | 1.0.3 | MIT | installed |
| `tslib` | 2.8.1 | 0BSD | installed |
| `utrie` | 1.0.2 | MIT | installed |
| `zod` | 4.4.3 | MIT | installed |
