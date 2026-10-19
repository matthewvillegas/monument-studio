# Dependency security review

**Reviewed October 18, 2026.** Production audit: zero reported findings. Complete
audit: five high-severity package findings caused by one advisory. This is an
unresolved development-tool dependency risk, not a vulnerability-free project.

## Repeated audit and compatible-fix investigation

Executed in the actual checkout with Node 24.16.0 / npm 11.15.0:

```text
npm audit --json
npm audit --omit=dev --json
npm ls braces micromatch fast-glob @next/eslint-plugin-next eslint-config-next --all
npm view braces version
npm view micromatch version
npm view fast-glob version
npm view eslint-config-next version
npm view @next/eslint-plugin-next@latest dependencies --json
```

| Installed chain | Installed version | Finding |
| --- | --- | --- |
| `eslint-config-next` | 16.4.0 | Direct development dependency; affected transitively |
| `@next/eslint-plugin-next` | 16.4.0 | Affected transitively |
| `fast-glob` | 3.3.1 | Affected transitively |
| `micromatch` | 4.0.8 | Affected transitively |
| `braces` | 3.0.3 | Advisory root |

[GHSA-vfj7-8cjw-p6xm / CVE-2026-93687](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
identifies unbounded recursion for deeply nested brace patterns, potentially
terminating the Node process through stack exhaustion. The advisory lists
versions through 3.0.3 and no patched release as of this review. Five audit
entries describe the propagation through a single chain; they are not five
independent vulnerabilities.

Registry checks returned `braces` 3.0.3, `micromatch` 4.0.8, `fast-glob` 3.3.3,
and `eslint-config-next` 16.4.2 as latest. The latest Next ESLint plugin still
pins `fast-glob` 3.3.1. Updating that plugin therefore does not remove this
advisory; updating fast-glob alone would still leave affected braces. npm's
suggested fix is a major downgrade to `eslint-config-next` 14.2.35, incompatible
with the present Next 16 toolchain. It was not applied. No speculative override,
vendored patch, forced downgrade, or manifest/lockfile change was made.

## Exposure in this application

`eslint-config-next` is declared under `devDependencies`. Source inspection of
its installed `get-root-dirs.js` shows the glob call is used for configured
Next root-directory patterns. This repository does not configure
`settings.next.rootDir` or derive lint patterns from inscription/import input.
The application does not import this dependency chain. The browser receives
validated data and uses local rendering; its only application fetch is the
same-origin PDF font. No customer inscription is passed to a shell or glob.

These observations narrow the demonstrated exposure to the development/build
context. They are not a proof that all tooling paths are unreachable. A
malicious change to lint configuration or other tooling that feeds crafted
patterns into braces could crash that process. Untrusted repository changes
already carry wider build-code execution risks.

## Mitigation and remaining risk

- Keep lint/CI on isolated runners with `contents: read`, no application
  credentials, no persisted checkout credentials, and a finite job timeout.
- Review changes to lint configuration, glob inputs, dependency manifests, and
  lockfiles before local execution or privileged deployment.
- Use the locked versions and retain the full audit as a visible non-blocking
  CI report. The production audit remains blocking. The warning is a disclosure,
  not a suppression or a claim that the vulnerability is fixed.
- Recheck the advisory and npm registry before authorizing publication. Apply a
  compatible patched chain when available, then repeat the full quality suite.
- Do not distribute development tools as part of a manually packaged production
  artifact. A build can install development tools; production hosting should
  receive the framework's intended deployment output.

Availability failure of developer/build tooling remains possible under crafted
input. No exploitation attempt or penetration-test certification is claimed.
The production audit's zero describes npm's known-advisory result for the
resolved production dependency graph at review time, not absence of unknown
vulnerabilities. Third-party rights are separately recorded in
[THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md).
