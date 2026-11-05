# Transcript

A time-coded dialogue log: time in `ink-muted` mono, speaker in mono, line in `body`, rows split by hairline `rule-soft` separators.

**Consumer provides:** `lines` (`time`, `speaker`, `text`, `active`) and an optional `title`. `text` may contain Redacted elements. Fills its container; text wraps at 64ch.

- Do: mark the line being discussed `active`; its speaker turns `signal`.
- Don't: use it for chat UIs; it is a record, not a conversation surface.
