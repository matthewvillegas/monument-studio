# GitHub publication package

Prepared October 17–18, 2026. No GitHub repository, remote, commit, tag, hosted workflow,
deployment, or public release has been created for this publication candidate. The following
copy and commands are prepared for an owner-approved publication.

The project license is now [MIT](../LICENSE), with
**Copyright (c) 2026 Matthew Villegas**. This resolves the software-license choice;
it does not authorize a commit, upload, deployment, or release. Retain third-party
notices and font OFL. Company names, logos, and branding have separate trademark
and endorsement considerations; their publication still requires owner review.

## Repository presentation

- **Suggested name:** `monument-studio` (availability not checked).
- **Description:** Parametric memorial designer with inch-based geometry,
  inscription editing, geometric analysis, local saves, and PNG/PDF exports.
- **Topics:** `mechanical-engineering`, `parametric-design`, `geometry`,
  `memorial-design`, `typescript`, `nextjs`, `react`, `svg`, `playwright`.
- **Website field:** leave empty until the deployed HTTPS URL is verified.
- **Profile:** pin the repository after publication. Use the description
  “Applying mathematics and computation to design and improve physical systems.”
  No other portfolio projects or public-status claims are needed.
- **Social preview recommendation:** an owner-approved genuine designer capture
  on a solid background, with the project name and “Parametric memorial design.”
  Keep fictional inscriptions visible and avoid test statistics, approval seals,
  or claims of customer adoption. Prepare 1280 × 640 pixels, PNG/JPG, under 1 MB;
  check readability at thumbnail size before upload. These dimensions follow
  [GitHub's social-preview guidance](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/customizing-your-repositorys-social-media-preview).

The [README](../README.md) is the landing page. Current architecture,
validation, and limitations describe the implementation available for review.
Add a CI badge only after the real workflow succeeds on the published commit.

## Honest initial import

Suggested subject:

```text
Import MonumentStudio 2D designer and verified release preparation
```

Suggested body:

```text
Import the existing implementation and verified release preparation.
Includes parametric straight/oval profiles,
inscriptions, preliminary area and volume calculations, versioned local/file
persistence, PNG/PDF outputs, tests, documentation, and reviewed demonstration
evidence.

This is the first source import, not a reconstruction of earlier Git history.
Local validation and remaining accessibility, dependency, human-review, and
publication limitations are recorded in docs/VALIDATION.md and
docs/RELEASE_READINESS.md.
```

Review the actual index before approving this import. Staging files does not
create a commit or authorize publication. Use the intended public author name
and an owner-approved email; do not change global Git identity automatically.

## Exact authorized sequence

All commands start in the repository containing `package.json` and `.git`.
The current unborn branch is `master`. The proposed published branch is `main`.
Do not run a later step until its required owner decision is recorded.

1. Approve disclosure path, company branding/asset use, the factual contribution
   statement, and reviewed media. Follow
   [PUBLICATION_CHECKLIST.md](PUBLICATION_CHECKLIST.md). Keep the selected root
   MIT license and third-party notices; no further project-license selection is
   needed. Keep the reviewed publication inventory and documentation references
   consistent with the approved index.
2. Review [PUBLICATION_INVENTORY.md](PUBLICATION_INVENTORY.md), refresh the
   quality suite and both audits, then inspect the exact candidate:

   ```powershell
   git status --short
   git diff --cached --stat
   git diff --cached --numstat
   git diff --cached --check
   git ls-files --cached
   git diff --cached
   git remote -v
   ```

   Stage any newly approved edits by explicit path, review the diff again, and
   ensure no private files or generated reports entered the index. The final
   index, not the working-directory inventory alone, defines the commit.
3. **After initial-commit authorization**, verify the local identity with
   `git var GIT_AUTHOR_IDENT` and `git var GIT_COMMITTER_IDENT`, then run:

   ```powershell
   git branch -m main
   git commit -m "Import MonumentStudio 2D designer and verified release preparation" -m "Import the existing implementation and reviewed demonstration evidence. This is the first source import; validation and remaining limitations are recorded in docs/VALIDATION.md and docs/RELEASE_READINESS.md."
   git show --stat --oneline HEAD
   ```

   Do not backdate the commit or reconstruct earlier development commits.
4. **After repository/remote/push authorization**, create an empty repository
   under the approved GitHub account with the approved visibility. Do not
   initialize another README or license remotely. Copy its verified clone URL
   into the following command; the placeholder is not an existing repository:

   ```powershell
   git remote add origin <owner-approved-clone-url>
   git remote -v
   git push -u origin main
   ```

5. Complete the hosted checklist below. Record the actual run URL and commit
   SHA. Do not turn a local result into a hosted success claim.
6. **After hosting authorization**, follow [DEPLOYMENT.md](DEPLOYMENT.md),
   inspect the deployed application, and only then add the real demo URL to
   the README and GitHub Website field. Recheck and commit that approved update.
7. **After release authorization**, tag the approved, verified commit and
   create the release using the draft below. Choose that exact commit in the
   GitHub release form; attach only the reviewed fictional samples and final
   walkthrough. Inspect each uploaded asset and its download link. No tag or
   release has been created locally.

## Hosted workflow acceptance

[verification.yml](../.github/workflows/verification.yml) uses Ubuntu 24.04,
Node 24.16.0, `npm ci`, lint, documentation links, strict types, unit tests,
production build, installed Chromium/Firefox/WebKit dependencies, production
browser tests, and both audits. Node 24 is a supported LTS release in
[Node's current schedule](https://nodejs.org/en/about/previous-releases).

The workflow has `contents: read`, no application secrets, checkout credential
persistence disabled, a 25-minute timeout, and actions pinned to full commit
SHAs. Failed browser evidence is retained for seven days. This follows
[GitHub's workflow security guidance](https://docs.github.com/en/actions/reference/security/secure-use).
Local actionlint 1.7.12 validation of this final workflow returned no findings
on October 18, 2026. This checks syntax and workflow structure; it does not
execute GitHub runners. The executed local suite is in
[VALIDATION.md](VALIDATION.md).

- [ ] The authorized `main` push starts “Verify MonumentStudio.”
- [ ] The run checks out the intended commit; Node version and `npm ci` match.
- [ ] Lint, local links, typecheck, unit tests, build, and browser installation
  succeed; inspect test totals and each browser rather than only job color.
- [ ] Production audit passes. Read the full audit warning: its step is
  intentionally non-blocking for the documented unpatched development chain.
  A green job does not mean the complete audit found nothing.
- [ ] On any browser failure, download and inspect the retained artifact;
  resolve or accurately record the failure before release.
- [ ] Check the job logs for privacy before linking them publicly.
- [ ] Record run URL, commit SHA, date, totals, skips/retries, and audit findings
  in the release evidence. Only then add an accurate workflow badge.
- [ ] Protect the main branch as appropriate for the approved collaboration
  model; keep untrusted pull requests away from deployment credentials.

## Draft first release: v0.1.0

**Recommendation:** `v0.1.0`, matching `package.json`; mark it a **pre-release**
because it is a preliminary portfolio demonstration with outstanding human and
accessibility review. This is a recommendation, not an existing release.

**Title:** MonumentStudio v0.1.0 — 2D engineering demonstration

When copying the draft to GitHub, replace its documentation-relative links with
the actual repository file URLs at the approved commit. Check every release-note
and attachment link in the published context; no repository URL is assumed here.

**Draft release body:**

MonumentStudio brings dimensioned memorial geometry, inscription editing, and
preliminary geometric analysis into one browser workflow. This is the first
public release of the existing implementation; it does not imply earlier
public versions.

- Straight-top and oval-top profiles with canonical inch measurements.
- Editable and repositionable inscriptions with preliminary layout warnings.
- Analytical profile area and nominal tablet/base/total volumes.
- Browser-local saving and versioned design-file import/export.
- High-resolution PNG, design-summary PDF, and optional preliminary proposal.
- Reusable SVG rendering, strict validation, unit and cross-browser tests,
  engineering methods, a reproducible example, and genuine sample outputs.

Consult [VALIDATION.md](VALIDATION.md) for executed local validation
and [RELEASE_READINESS.md](RELEASE_READINESS.md) for remaining review. Add the
actual hosted run and demonstration links only after they exist.

This demonstration does not provide manufacturing, cemetery, engraving,
structural, or lifting approval. It has no production pricing, accounts,
customer database, 3D model, or business-adoption claim. PDFs are untagged;
spoken screen-reader review and physical printing remain separate acceptance
items. Five high-severity development-package findings currently trace to one
unpatched braces advisory; the production audit reported zero. Review
[dependency security](DEPENDENCY_SECURITY.md) and [third-party rights](THIRD_PARTY_LICENSES.md).

MonumentStudio's original software and associated documentation are available
under the [MIT License](../LICENSE), Copyright (c) 2026 Matthew Villegas.
Third-party components and the bundled font retain their respective licenses
and notices. The software license does not grant trademark rights in company
names, logos, or branding, or imply endorsement by Villegas Headstones &
Monuments LLC.
