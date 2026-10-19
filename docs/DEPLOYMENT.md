# Demonstration deployment preparation

Prepared October 17, 2026. No public deployment or hosted URL exists for this
publication candidate. Deployment requires explicit owner authorization, disclosure/rights
decisions, and verification on the selected host.

## Recommended route

Use a managed Next.js deployment on Vercel for the first approved demonstration.
Its documented Next.js integration supports the existing framework without
adding a database, account service, export server, or deployment adapter.
This is an engineering recommendation based on
[Vercel's Next.js support](https://vercel.com/docs/frameworks/full-stack/nextjs),
not an account setup or hosting purchase. The owner must approve the provider,
account, applicable plan/terms, cost, public visibility, and business use.

The existing `next.config.ts` and `build`/`start` scripts suffice; no speculative
`vercel.json`, secret, or hosting integration was added. The application route
is static at build time, but the repository is currently built and tested as
a normal Next.js application. A Node host using `npm run build` and `npm start`
is a viable alternative. Static export is another framework option, but has
different feature limits and has not been configured or verified here.
See [Next.js deployment options](https://nextjs.org/docs/app/getting-started/deploying).

## Concrete configuration

| Setting | Prepared value |
| --- | --- |
| Import | Owner-approved repository and commit |
| Framework | Next.js |
| Root directory | `.` when this `folder` repository is the Git root |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | Leave the Next.js framework default |
| Node | `24.x`; record the host's actual patch version |
| Environment variables | None required by the application |
| Database/authentication | None |
| Application base path | `/` on its own origin |

Do not select the outer workspace or scaffold as the deployment root. Vercel
currently supports Node 24.x and manages its patch updates; the hosted patch
can therefore differ from the locally verified 24.16.0. Confirm it in the
build log. [Vercel Node version documentation](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

Do not host under an untested subdirectory: the PDF font fetch is explicitly
`/fonts/NotoSans-Regular.ttf`. The application uses system fonts in SVG and
Noto Sans for PDF text. It has no analytics integration or inscription upload
endpoint. Hosting infrastructure may still keep request logs; review the
provider's privacy settings and public wording with the owner.

## Before authorizing the upload

- Review [PUBLICATION_INVENTORY.md](PUBLICATION_INVENTORY.md) and the staged
  candidate. Include no environment files, customer data, logs, browser profiles,
  private archive, or test-result bundles.
- Repeat the current lockfile's quality suite and audits; use
  [VALIDATION.md](VALIDATION.md) for the actual local results.
- Retain `public/THIRD_PARTY_NOTICES.txt`, `public/fonts/OFL.txt`, and font
  provenance. Review target-platform dependency notices, especially native
  Sharp/libvips packaging, as described in
  [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md).
- Approve fictional demonstration content, the business name, preliminary
  engineering disclaimers, and the rights/usage statement.
- Decide whether previews should require host-level access protection before
  public release. A preview deployment is still an external deployment and
  requires authorization.

## After authorization: deploy and verify

1. Import the approved repository into the approved account, apply the settings
   above, and deploy the exact reviewed commit. Record the commit, build log,
   host/runtime version, and resulting HTTPS URL.
2. Open that URL in a fresh browser profile. Check desktop 1440px, tablet
   1024px, and phone 390px; check the real available mobile device separately.
   Verify icons, fonts, background styling, keyboard focus, and expanded drawing.
3. Use fictional details to select both shapes, change measurements, edit and
   position inscriptions, trigger/clear layout warnings, and compare quantities
   with [the reproducible example](../examples/oval-memorial.design.json).
4. Save, reload, open the saved design, download a JSON file, change the design,
   and import the downloaded file. Check the same canonical values survive.
5. Generate PNG, summary PDF, and preliminary proposal. Open actual downloaded
   files, extract PDF text and inspect rendered pages. Confirm the same values,
   readable margins, uncut inscriptions, and preliminary disclaimers. Check
   failure/cancel recovery without exposing customer details.
6. Verify `/fonts/NotoSans-Regular.ttf`, `/fonts/OFL.txt`, and
   `/THIRD_PARTY_NOTICES.txt` return successfully on the deployed origin.
   Inspect browser network/console for font failures and unexpected requests.
7. Repeat the three-browser smoke workflow on the actual deployed origin,
   recording versions and outcomes. The repository's automated suite starts a
   local production server; it does not automatically test the hosted URL.
8. Record unresolved accessibility, real-device, human-trial, and print gaps.
   Confirm the host has not enabled additional analytics or services beyond
   the approved deployment. Then add the real verified URL to README/repository
   metadata under the owner's publication authorization.

If hosting changes the origin or domain, browser-local saves do not transfer.
Visitors should download a design file before migration and import it on the
new origin. Proposal details are temporary form state but remain in downloaded
PDFs. This is not a secure customer-record or backup system.

For a failed release, use the host's approved rollback to the last verified
deployment and retest it. Do not delete visitor browser storage, issue a new
schema, or report deployment success from a passing local build alone.
