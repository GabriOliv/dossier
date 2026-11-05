# release-0-1-0 proofs

**HEAD**: 949d03c
**Tree**: clean
**Shell**: /bin/sh
**Result**: 25 pass, 0 fail

| Check | Proof | Result |
| --- | --- | --- |
| C1 | `run release / ✓ REL-01 a version tag runs format, unit tests, publint and consumer tests in order` | pass |
| C2 | `run release / ✓ REL-02 the release job creates the tag's release with the tarball` | pass |
| C3 | `run release / ✓ REL-03 the attached tarball is the one the consumer tests installed` | pass |
| C4 | `run release / ✓ REL-04 a tag that differs from package.json fails with both versions` | pass |
| C5 | `run release / ✓ REL-05 no release job runs unless preflight and verify passed` | pass |
| C6 | `run release / ✓ REL-06 only the release job can write, and nothing talks to npm` | pass |
| C7 | `run release / ✓ REL-07 a manual run keeps the tarball as an artifact and creates no release` | pass |
| C8 | `run release / ✓ REL-08 an existing release fails instead of being replaced` | pass |
| C9 | `run release / ✓ REL-09 the release stays a draft until the tarball is uploaded` | pass |
| C10 | `run release / ✓ REL-10 a tag on a commit outside main fails` | pass |
| C11 | `run release / ✓ REL-11 the release text starts with the install command for the version` | pass |
| C12 | `run release / ✓ REL-12 a different tarball behind the URL fails the install check` | pass |
| C13 | `run release / ✓ DOC-01 the README install URL matches package.json's version` | pass |
| C14 | `run release / ✓ DOC-02 the README explains how to cut a release` | pass |
| C15 | `run release / ✓ DOC-03 PLANO.md points F3 and versioning at AD-001` | pass |
| C21 | `run release / ✓ DOC-04 the README pushes main before the tag` | pass |
| C16 | `run release / ✓ LIC-01 LICENSE is MIT for GabriOliv` | pass |
| C17 | `run release / ✓ LIC-02 package.json declares MIT` | pass |
| C18 | `run release / ✓ LIC-03 the tarball carries LICENSE and the font licenses` | pass |
| C19 | `run release / ✓ LIC-04 the README names MIT and OFL 1.1` | pass |
| C20 | `run release / ✓ CI-01 pull requests run the consumer tests` | pass |
| Build | `docker compose run --rm -e NPM_CONFIG_UPDATE_NOTIFIER=false node npm run build` | pass |
| Build | `docker compose run --rm -e NPM_CONFIG_UPDATE_NOTIFIER=false node npm run format` | pass |
| Build | `docker compose run --rm -e NPM_CONFIG_UPDATE_NOTIFIER=false node npm run lint:package` | pass |
| Build | `docker run --rm -v "$PWD:/repo" -w /repo rhysd/actionlint:1.7.12 -color` | pass |

## Output

`Run release` - exit 0

```
  ✓  16 [unit] › tests/unit/release/preflight.spec.ts:53:1 › REL-10 a tag on a commit outside main fails (203ms)
  ✓  21 [unit] › tests/unit/release/workflows.spec.ts:142:1 › CI-01 pull requests run the consumer tests (13ms)
  ✓   6 [unit] › tests/unit/release/docs.spec.ts:40:1 › LIC-03 the tarball carries LICENSE and the font licenses (1.3s)
  ✓  22 [unit] › tests/unit/release/docs.spec.ts:60:1 › DOC-01 the README install URL matches package.json's version (5ms)
  ✓  23 [unit] › tests/unit/release/docs.spec.ts:72:1 › DOC-02 the README explains how to cut a release (7ms)
  ✓  24 [unit] › tests/unit/release/docs.spec.ts:88:1 › DOC-04 the README pushes main before the tag (6ms)
  ✓  25 [unit] › tests/unit/release/docs.spec.ts:95:1 › DOC-03 PLANO.md points F3 and versioning at AD-001 (14ms)
  ✓  26 [unit] › tests/unit/release/docs.spec.ts:108:1 › LIC-04 the README names MIT and OFL 1.1 (15ms)
  ✓   3 [unit] › tests/unit/release/verify-install.spec.ts:42:1 › REL-12 the URL that serves the tested tarball passes the install check (1.3s)
  ✓  27 [unit] › tests/unit/release/verify-install.spec.ts:47:1 › REL-12 a different tarball behind the URL fails the install check (1.2s)
  ✓  28 [unit] › tests/unit/release/verify-install.spec.ts:55:1 › REL-12 a URL that answers 404 fails the install check (662ms)

  28 passed (6.3s)
 Container dossier-node-run-b2c67709556d Creating 
 Container dossier-node-run-b2c67709556d Created
```
