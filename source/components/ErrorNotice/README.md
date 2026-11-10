# ErrorNotice

A blocking error at the top of a page or module: a `stroke-heavy` `contrast-error` rule, the error mark with "ERROR · <code>", an uppercase title, an explanation, an optional list of specific failures and the next step after a triangle pointer.

**Consumer provides:** `title` (what failed and what it blocks), optional `code`, `meta` (timestamp), `children` (one or two sentences), `items` (one line per failure) and `action`. Set `live` only when the notice appears after a user action, so screen readers announce it.

- Do: one ErrorNotice per page, directly under the header, before any data.
- Do: end with the next step ("Rerun after fix #1182"), not only the problem.
- Don't: use it for warnings or information; if nothing is blocked, it is not an ErrorNotice.
