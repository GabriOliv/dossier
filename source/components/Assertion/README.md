# Assertion

Expected against actual for one check: a mono label with a StatusFlag, then EXPECTED and ACTUAL rows in mono. On failure the top rule and the ACTUAL row turn `contrast-error` and the actual value gets the error mark.

**Consumer provides:** `expected`, `actual`, optional `label`, `location` (file and line) and `pass` (by default it passes when both are equal as strings).

- Do: show the raw values as the system returned them (status lines, numbers with units).
- Do: place it beside the CheckLog row it explains, with the same check id in the label.
- Don't: use it for long diffs; link to the log.
