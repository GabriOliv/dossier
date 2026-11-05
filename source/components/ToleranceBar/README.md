# ToleranceBar

One measured value against its allowed range: the range as a `panel` band on a hairline scale, the value as a marker with a triangle pointer. Within range it is `ink` and reads WITHIN LIMIT; out of range the marker and readout turn `contrast-error` and state the overshoot ("OUT OF RANGE +0.64 s").

**Consumer provides:** `label`, `value`, `min` and/or `max`, optional `scaleMin`, `scaleMax`, `unit` and `format`. Fills its container's width.

- Do: choose a scale that shows both the limit and the value with room either side.
- Do: stack related measures with `space-6` between them and the same scale where they share a unit.
- Don't: use it for targets you want to exceed; it is for limits.
