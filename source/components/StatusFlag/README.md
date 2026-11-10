# StatusFlag

The result of one check as a square mono flag: PASS (ink outline, filled square), FAIL (`contrast-error` fill, cross, `on-signal` text), SKIPPED (dashed muted outline) and PENDING (muted outline, hollow square).

**Consumer provides:** `status` (`pass`, `fail`, `skip`, `pending`) and optionally a one-word `children` to replace the default word.

- Do: use it wherever a check, test or job has a result; it is the only status label that may turn red.
- Do: keep the word; the mark and colour never carry the result alone.
- Don't: use it for workflow states that are not results (draft, archived); that is a Tag.
