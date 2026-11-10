import { forwardRef, type ReactNode } from "react";
import { cls } from "../lib/cls";
import type { NativeProps } from "../lib/native";
import { useStableId } from "../lib/useStableId";

export interface AccordionItem {
  /** The text of the summary, which opens and closes the item. Keep headings out: the summary is a button. */
  title: ReactNode;
  content: ReactNode;
  /** The item starts open. */
  defaultOpen?: boolean;
}

interface AccordionOwnProps {
  /** The sections, in order. With none nothing renders. */
  items: AccordionItem[];
  /** Only one item is open at a time: opening one closes the open one. */
  exclusive?: boolean;
  className?: string;
}

export type AccordionProps = AccordionOwnProps & NativeProps<"div", AccordionOwnProps>;

/**
 * Sections that open and close, on native `<details>` and `<summary>`: they work without JS, and the browser's find in
 * page opens the item it finds text in. The browser keeps each item's state. With `exclusive` every item shares one
 * `name`, so the browser keeps one open.
 */
export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(function Accordion(
  { items, exclusive, className, ...rest },
  ref,
) {
  const name = useStableId("ds-acc-");
  if (!items.length) return null;
  return (
    <div {...rest} ref={ref} className={cls("ds-accordion", className)}>
      {items.map((item, i) => (
        <details key={i} className="ds-accordion-item" name={exclusive ? name : undefined} open={item.defaultOpen}>
          <summary className="ds-t-body ds-accordion-summary">{item.title}</summary>
          <div className="ds-t-body ds-accordion-content">{item.content}</div>
        </details>
      ))}
    </div>
  );
});
