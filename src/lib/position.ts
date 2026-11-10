export type Placement = "bottom-start" | "bottom-end" | "top-start" | "top-end";

export interface Size {
  width: number;
  height: number;
}

/** Space between the trigger and the panel, in px. */
const GAP = 4;

/**
 * Where a panel of `panel` size goes next to `trigger`, in viewport coordinates (for `position: fixed`). `start`
 * aligns the left edges, `end` the right edges. A panel that does not fit on the requested side of the viewport, and
 * fits on the other, flips to the other side; one that fits on neither keeps the requested side.
 */
export function place(
  trigger: Pick<DOMRect, "top" | "bottom" | "left" | "right">,
  panel: Size,
  viewport: Size,
  placement: Placement,
): { top: number; left: number; placement: Placement } {
  const [side, align] = placement.split("-") as ["bottom" | "top", "start" | "end"];
  const below = trigger.bottom + GAP + panel.height <= viewport.height;
  const above = trigger.top - GAP - panel.height >= 0;
  const flip = side === "bottom" ? !below && above : !above && below;
  const to = flip ? (side === "bottom" ? "top" : "bottom") : side;
  return {
    top: to === "bottom" ? trigger.bottom + GAP : trigger.top - GAP - panel.height,
    left: align === "start" ? trigger.left : trigger.right - panel.width,
    placement: `${to}-${align}`,
  };
}

// SPEC_DEVIATION: the design names a `usePlacement` hook; this is a plain function each overlay calls in its own effect.
// Reason: a hook here imports useEffect into a module without "use client", which FWK-02 reports, and OVL-02 allows the
// directive only in the 4 overlay files.
/**
 * Places the shown `panel` next to `trigger` now, and again on every scroll (of any element) and resize, until the
 * returned function is called.
 */
export function follow(trigger: HTMLElement, panel: HTMLElement, placement: Placement): () => void {
  const update = () => {
    const root = document.documentElement;
    const at = place(
      trigger.getBoundingClientRect(),
      { width: panel.offsetWidth, height: panel.offsetHeight },
      { width: root.clientWidth, height: root.clientHeight },
      placement,
    );
    panel.style.top = `${at.top}px`;
    panel.style.left = `${at.left}px`;
  };
  update();
  window.addEventListener("scroll", update, true);
  window.addEventListener("resize", update);
  return () => {
    window.removeEventListener("scroll", update, true);
    window.removeEventListener("resize", update);
  };
}
