# TestRunReport

A composition, not an exported component: a failed regression run laid out as one Dossier page, showing where each error component belongs.

The order is the rule: DataHeader (status in the meta) → ErrorNotice (what is blocked and the next step) → Readout row (scale of the run) → SectionTitle + CheckLog (every result, failures explained) → SectionTitle + Assertion and ToleranceBar side by side (the evidence for each failure) → SectionTitle + TextField and FieldList (the action a person can take) → Footnotes (where limits and load profiles come from).

- Do: copy the preview as a starting point for run reports, incident pages and audit summaries.
- Do: keep `contrast-error` on the failures only; the rest of the page stays ink, and signal keeps marking position (the section kicker).
- Don't: open a page with an ErrorNotice when nothing is blocked; use the CheckLog alone.
