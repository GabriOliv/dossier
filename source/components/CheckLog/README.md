# CheckLog

A list of checks with their results: a heading with a pass/fail/skip summary (fail count in `contrast-error`), then rows of id, label, detail, duration and a StatusFlag. Failed rows turn their id and detail `contrast-error`.

**Consumer provides:** `checks` (`id`, `label`, `result`, `detail`, `duration`) and an optional `title`. Fills its container's width.

- Do: put the failure reason or measured value in `detail` so a failed row explains itself.
- Do: keep the run order; don't sort failures to the top unless the list is long, then say so in the title.
- Don't: more than about 20 rows; link to the full run instead.
