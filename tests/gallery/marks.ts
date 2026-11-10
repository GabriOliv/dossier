import type { Page } from "@playwright/test";

/** The marks checked in forced-colors mode; `::before` marks are read on the pseudo-element. */
export const MARKS = [
  ".ds-index",
  ".ds-tag-solid",
  ".ds-tag-inverse",
  ".ds-section-bar",
  ".ds-cell-on",
  ".ds-bar-fill",
  ".ds-tl-mark",
  ".ds-tree-root",
  ".ds-tree-on",
  ".ds-redact",
  ".ds-cmp-item::before",
  ".ds-flag-dot",
  ".ds-flag-fail",
  ".ds-errnote-item::before",
  ".ds-tol-marker",
  ".ds-row-hl td",
];

export interface MarkStyle {
  mark: string;
  i: number;
  background: string;
  color: string;
  /** Top border colour. */
  border: string;
  width: string;
  height: string;
  borderTop: string;
  borderRight: string;
  borderBottom: string;
  borderLeft: string;
  boxShadow: string;
  outlineColor: string;
  outlineStyle: string;
  outlineWidth: string;
  forcedColorAdjust: string;
}

/** After the fonts load: the computed colours, size, borders, shadow and outline of every element each mark selector matches. */
export async function readMarks(page: Page): Promise<MarkStyle[]> {
  // Text marks are as wide as their text: read them with the fonts loaded.
  await page.evaluate(() => document.fonts.ready);
  return page.evaluate((marks) => {
    return marks.flatMap((mark) => {
      const [selector, pseudo] = mark.split("::");
      return [...document.querySelectorAll(selector)].map((el, i) => {
        const s = getComputedStyle(el, pseudo ? `::${pseudo}` : null);
        return {
          mark,
          i,
          background: s.backgroundColor,
          color: s.color,
          border: s.borderTopColor,
          width: s.width,
          height: s.height,
          borderTop: s.borderTop,
          borderRight: s.borderRight,
          borderBottom: s.borderBottom,
          borderLeft: s.borderLeft,
          boxShadow: s.boxShadow,
          outlineColor: s.outlineColor,
          outlineStyle: s.outlineStyle,
          outlineWidth: s.outlineWidth,
          forcedColorAdjust: s.getPropertyValue("forced-color-adjust"),
        };
      });
    });
  }, MARKS);
}
