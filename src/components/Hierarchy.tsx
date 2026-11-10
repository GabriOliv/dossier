import { forwardRef } from "react";
import { cls } from "../lib/cls";
import { en } from "../locales/en";
import type { Locale } from "../locales/types";
import { pick } from "../lib/labels";
import type { NativeProps } from "../lib/native";

export interface HierarchyNode {
  label: string;
  code?: string;
  /** Signal fill; one per tree. */
  active?: boolean;
  children?: HierarchyNode[];
}

interface HierarchyOwnProps {
  /** The root renders on the inverse fill. */
  root?: HierarchyNode | null;
  title?: string;
  /** The accessible name used without `title`, falling back to English: `labels={ptBR.Hierarchy}`. */
  labels?: Partial<Locale["Hierarchy"]>;
  className?: string;
}

export type HierarchyProps = HierarchyOwnProps & NativeProps<"div", HierarchyOwnProps>;

function TreeNode({ node, depth }: { node: HierarchyNode; depth: number }) {
  const kids = node.children || [];
  return (
    <li>
      <div className={cls("ds-tree-node", depth === 0 && "ds-tree-root", node.active && "ds-tree-on")}>
        {node.code ? <span className="ds-t-label ds-tree-code">{node.code}</span> : null}
        <span className="ds-t-body ds-tree-label">{node.label}</span>
      </div>
      {kids.length ? (
        <ul>
          {kids.map((c, i) => (
            <TreeNode key={i} node={c} depth={depth + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

/** Port of Dossier's Hierarchy: a top-down tree of square nodes with orthogonal connectors. */
export const Hierarchy = forwardRef<HTMLDivElement, HierarchyProps>(function Hierarchy(
  { root, title, labels, className, ...rest },
  ref,
) {
  if (!root) return null;
  return (
    // tabIndex: the tree scrolls sideways on narrow screens, and a keyboard can scroll only what it can focus.
    <div
      ref={ref}
      className={cls("ds-tree", className)}
      aria-label={title || pick(labels?.name, en.Hierarchy.name)}
      tabIndex={0}
      {...rest}
    >
      <ul>
        <TreeNode node={root} depth={0} />
      </ul>
    </div>
  );
});
