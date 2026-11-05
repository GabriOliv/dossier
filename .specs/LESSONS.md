# LESSONS - auto-maintained by scripts/lessons.py

> Machine-owned. Do NOT hand-edit. Changes are overwritten on the next `lessons.py` write.
> Canonical state lives in `.specs/lessons.json`. Edit lessons only via the script.
> promote_threshold=2 distinct features · window_days=45 · quarantine_threshold=2

## Confirmed (load these at Plan/Checks)

Corroborated across multiple features. Safe to apply as guidance.

_none_

## Candidates (under observation - do NOT load as guidance yet)

Seen once or not yet corroborated. Tracked, not trusted.

### L-001 - When testing a GitHub Actions workflow, assert failure guards (continue-on-error, status functions) on every step, not only on jobs
- signal: `weak_test` · recurrence: 1 feature(s) · scope: `workflows` · harmful: 0
- features: release-0-1-0
- evidence: C5 (workflows)
- last seen: 2026-11-05T04:52:11Z

### L-002 - A workflow step that must stop on the first failing command needs an explicit set -euo pipefail and a test that forbids a shell override
- signal: `weak_test` · recurrence: 1 feature(s) · scope: `workflows` · harmful: 0
- features: release-0-1-0
- evidence: C9 (workflows)
- last seen: 2026-11-05T04:52:11Z

### L-003 - To prove a later job reuses a built artifact, forbid every command that could rebuild it, not only the literal pack command
- signal: `weak_test` · recurrence: 1 feature(s) · scope: `workflows` · harmful: 0
- features: release-0-1-0
- evidence: C3 (workflows)
- last seen: 2026-11-05T04:52:11Z

### L-004 - A documented procedure must be checked step by step against the guard that enforces it, such as a remote-branch check
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `docs` · harmful: 0
- features: release-0-1-0
- evidence: C14 (docs)
- last seen: 2026-11-05T04:52:12Z

### L-005 - A test for a required note asserts each fact the criterion names, not only the reference it cites
- signal: `weak_test` · recurrence: 1 feature(s) · scope: `docs` · harmful: 0
- features: release-0-1-0
- evidence: C15 (docs)
- last seen: 2026-11-05T04:52:12Z

### L-006 - Compare a license file with the full canonical text, not with a few fragments
- signal: `weak_test` · recurrence: 1 feature(s) · scope: `docs` · harmful: 0
- features: release-0-1-0
- evidence: C16 (docs)
- last seen: 2026-11-05T04:52:12Z

### L-007 - Keep Markdown-special characters such as asterisks out of test titles that proofs quote, because Prettier escapes them
- signal: `gate_fail` · recurrence: 1 feature(s) · scope: `specs` · harmful: 0
- features: release-0-1-0
- evidence: C1 (specs)
- last seen: 2026-11-05T04:52:12Z

## Quarantined (failed when applied - ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
