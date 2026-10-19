# Publication acceptance checklist

**Publication preparation, October 17–18, 2026.** Local work is authorized; a commit,
remote, push, deployment, or release still requires explicit owner authorization.
The project license decision is complete: [MIT](../LICENSE),
Copyright (c) 2026 Matthew Villegas. The final executed evidence is in
[VALIDATION.md](VALIDATION.md), with the current decision summary in
[RELEASE_READINESS.md](RELEASE_READINESS.md).

## Selected license and remaining disclosure choices

| | Option A: public source and live demonstration | Option B: public demonstration with restricted source disclosure |
| --- | --- | --- |
| What viewers receive | Source, equations, tests, documentation, genuine evidence, and the application | The application and approved technical explanation/evidence; private repository or withheld business implementation |
| Benefit | Strong independent inspectability and reproducibility | Greater control of source disclosure while showing the workflow |
| Tradeoff | All published files and history can be inspected and copied; rights and confidentiality must be reviewed first | Reduced source reproducibility; browser-delivered client code and assets are still visible |
| Owner decisions | Business/asset rights, publication scope, repository visibility, hosting; retain the selected MIT license | Private-source access, approved excerpts, client assets, hosting and privacy wording; MIT permissions still apply to distributed software |

A recorded or private demonstration is also available if public hosting is not
approved. Withholding a source repository does not hide JavaScript delivered to
a browser. No credentials or proprietary pricing belong in that client.

The root `LICENSE` contains the standard MIT grant and disclaimer with the
selected copyright notice. Keeping a repository private controls repository
access; it does not remove MIT permissions from software copies distributed
under that license. Preserve the copyright and permission notice in copies or
substantial portions. See the [MIT text](../LICENSE).

MIT software permissions do not grant trademark rights in the Villegas Headstones
& Monuments LLC name, logos, or branding, or company endorsement. Authorization
to publish company identity and supplied assets remains separate. Preserve
[third-party notices](../public/THIRD_PARTY_NOTICES.txt), bundled font OFL, and
the respective component licenses. The dated [third-party inventory](THIRD_PARTY_LICENSES.md)
retains its original review-time context; it does not override the selected MIT
license for the project's original software and documentation.

## Local package review

- [x] Confirm the root MIT text and `Copyright (c) 2026 Matthew Villegas`.
- [ ] Review the final [publication inventory](PUBLICATION_INVENTORY.md) and
  staged diff; confirm each included file and binary. Recheck after any change.
- [ ] Confirm the public package contains current technical documentation and
  clearly dated demonstration evidence. Earlier media must not imply features
  it does not demonstrate or previously published releases.
- [ ] Review current screenshots, fictional JSON, PNG, both PDFs, captions, and
  final walkthrough. No participant/customer information may enter the package.
- [ ] Verify caches, environment files, browser profiles, traces, logs, raw
  recordings, and private archive are absent from the actual Git index.
- [ ] Review bundled font provenance/OFL and dependency notices. Inspect the
  target platform before distributing native binaries or a packaged server.
- [ ] Confirm README, case study, initial-commit description, changelog, and
  release draft describe verified engineering work and documented contributions
  without claiming sole code authorship or completed human review.
- [ ] Read the actual lint/types/unit/build/browser/link/audit results. Complete
  audit findings must remain disclosed even if the production audit passes.

The latest inspection evidence is recorded in the reports; these boxes are
owner acceptance actions, not an instruction to invent missing test outcomes.

## Human acceptance and remaining limitations

- [ ] Confirm ownership and authority to publish the business name and assets.
- [ ] Approve the creator contribution statement based on work actually done.
- [ ] Run the prepared [consultant trial](USABILITY_TEST_PLAN.md) with a real
  representative; record consented, anonymous observations only when it occurs.
- [ ] Complete or explicitly accept the outstanding accessibility items in
  [ACCESSIBILITY_ACCEPTANCE.md](ACCESSIBILITY_ACCEPTANCE.md), including spoken
  screen-reader testing and real-device/browser zoom review where pending.
- [ ] Review physical printing at ordinary document scale. Rendered PDF pages
  are useful evidence but do not establish that a physical print was inspected.
- [ ] Accept the untagged PDF accessibility and supported-text limitations; do
  not claim PDF/UA compliance or reliable unsupported-script shaping.
- [ ] Accept preliminary area/volume and layout calculations as consultation
  aids. No supplier, engraving, cemetery, lifting, installation, structural, or
  manufacturing approval follows from the prototype's checks.
- [ ] Review the current [dependency finding](DEPENDENCY_SECURITY.md): five high
  package findings from one development-only braces advisory were unresolved
  at the local audit. Recheck for compatible fixes before publication.

## Actions requiring owner authorization

- [ ] Choose the disclosure path and approve branding/asset use; the project
  MIT license has already been selected.
- [ ] Approve the truthful initial source-import commit and public Git identity.
- [ ] Approve the repository owner/name/visibility, remote configuration, and push.
- [ ] Approve host/account/plan, deployment visibility, and public demonstration.
- [ ] Approve `v0.1.0` as a preliminary first release, its notes, and attachments.

[GitHub publication instructions](GITHUB_PUBLICATION.md) provide the exact
sequence, prepared repository metadata, honest commit wording, hosted workflow
checklist, and release draft. No earlier Git history should be reconstructed.

## Verify after authorized publication

- [ ] Record the real hosted workflow URL and commit; inspect every required
  check, audit report, browser result, retry, skip, and failure artifact.
- [ ] Add a CI badge only after an actual successful hosted run.
- [ ] Follow [deployment acceptance](DEPLOYMENT.md) on the actual HTTPS origin;
  confirm font/notices, responsive UI, persistence, downloads, and PDF output.
- [ ] Add the verified public URL to README and repository metadata only then.
- [ ] Review privacy wording: local saves are profile/origin specific, are not
  encrypted customer records, and do not transfer to another origin. Proposal
  fields clear with the dialog but persist in the downloaded PDF.
- [ ] Inspect the published file set, media downloads, social preview, first
  release notes, and rights statement; pin the repository if desired.

No public release, deployment, hosted CI success, consultant feedback, physical
print review, or legal clearance is implied by local release preparation.
