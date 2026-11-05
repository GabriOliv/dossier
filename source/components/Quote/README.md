# Quote

Large uppercase text in `title`, in two variants: `quote` (default), an attributed quote opened by a hanging `signal` mark under a `stroke-rule` rule, with a dashed source line; `statement`, the key message of a page or slide, with an optional eyebrow `kicker` above and a one-sentence `note` below.

**Consumer provides:** the text as children (one or two sentences; wrap the key figure in `<span className="ds-hl">` to set it in `signal`), `variant`, and for quotes `source` and `code`, for statements `kicker` and `note`. Max width 640px.

- Do: one quote or statement per page or slide.
- Do: lead a statement with the number when there is one ("90% of …").
- Don't: long passages; keep the one sentence that matters.
