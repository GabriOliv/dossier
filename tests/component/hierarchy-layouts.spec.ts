import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, type Page } from "@playwright/test";
import { Hierarchy, type HierarchyNode, type HierarchyProps } from "../../src/components/Hierarchy";

// The Hierarchy geometry: every node reachable by scroll (TREE-01 to TREE-04).
const css = readFileSync("dist/styles.css", "utf8");
const THEMES = ["paper", "void"] as const;

/** The CTAL-TM 2.2.2 effort tree of the Garden: five branches, wider than any phone or article column. */
const WIDE: HierarchyNode = {
  label: "Esforço de teste",
  children: [
    {
      label: "Produto",
      children: [
        { label: "Qualidade da base de teste" },
        { label: "Tamanho do produto" },
        { label: "Complexidade do domínio" },
        { label: "Requisitos de qualidade (ex.: alta confiabilidade)" },
      ],
    },
    {
      label: "Processo de desenvolvimento",
      children: [
        { label: "Estabilidade e maturidade do processo" },
        { label: "Modelo de desenvolvimento" },
        { label: "Fatores materiais (ex.: ferramentas)" },
      ],
    },
    { label: "Pessoas", children: [{ label: "Satisfação da equipe" }, { label: "Habilidades e experiência" }] },
    {
      label: "Resultados do teste",
      children: [{ label: "Gravidade dos defeitos" }, { label: "Quantidade de retrabalho" }],
    },
    {
      label: "Contexto do teste",
      children: [{ label: "Complexidade do projeto" }, { label: "Trabalho local ou remoto" }],
    },
  ],
};

const NARROW: HierarchyNode = { label: "Root", children: [{ label: "A" }, { label: "B" }] };

/** A blank page in `theme` with the package styles and the tree inside a box `width` px wide. */
async function openTree(page: Page, theme: string, width: number, props: HierarchyProps): Promise<void> {
  const markup = renderToStaticMarkup(createElement(Hierarchy, props));
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.setContent(
    `<!doctype html><html data-theme="${theme}"><body style="margin:0"><div id="box" style="width:${width}px">${markup}</div></body></html>`,
  );
  await page.addStyleTag({ content: css });
}

/** The tree's box (its inner edges) and the left and right edges of every node, as the page lays them out now. */
const measure = (page: Page) =>
  page.locator(".ds-tree").evaluate((tree) => {
    const r = tree.getBoundingClientRect();
    const nodes = [...tree.querySelectorAll(".ds-tree-node")].map((n) => n.getBoundingClientRect());
    return {
      inner: { left: r.left + tree.clientLeft, right: r.left + tree.clientLeft + tree.clientWidth },
      left: Math.min(...nodes.map((n) => n.left)),
      right: Math.max(...nodes.map((n) => n.right)),
      scrollLeft: tree.scrollLeft,
      overflows: tree.scrollWidth > tree.clientWidth,
      root: tree.querySelector(".ds-tree-root")!.getBoundingClientRect(),
    };
  });

for (const theme of THEMES) {
  test(`TREE-01 a tree wider than its box starts with its leftmost node inside the box, ${theme}`, async ({ page }) => {
    await openTree(page, theme, 320, { root: WIDE });
    const m = await measure(page);
    expect(m.overflows, "the tree is wider than its box").toBe(true);
    expect(m.scrollLeft).toBe(0);
    expect(m.left).toBeGreaterThanOrEqual(m.inner.left);
  });

  test(`TREE-02 scrolled to the end, the rightmost node of a wide tree ends inside the box, ${theme}`, async ({
    page,
  }) => {
    await openTree(page, theme, 320, { root: WIDE });
    await page.locator(".ds-tree").evaluate((tree) => (tree.scrollLeft = tree.scrollWidth));
    const m = await measure(page);
    expect(m.scrollLeft, "the tree scrolled").toBeGreaterThan(0);
    expect(m.right).toBeLessThanOrEqual(m.inner.right);
  });

  test(`TREE-03 a wide tree renders scrolled to its left edge, ${theme}`, async ({ page }) => {
    await openTree(page, theme, 320, { root: WIDE });
    const m = await measure(page);
    expect(m.overflows, "the tree is wider than its box").toBe(true);
    expect(m.scrollLeft).toBe(0);
  });

  test(`TREE-04 a tree narrower than its box keeps its root centred, ${theme}`, async ({ page }) => {
    await openTree(page, theme, 900, { root: NARROW });
    const m = await measure(page);
    expect(m.overflows).toBe(false);
    const centre = m.root.left + m.root.width / 2;
    expect(Math.abs(centre - (m.inner.left + m.inner.right) / 2)).toBeLessThanOrEqual(1);
  });
}

/** Each parent node with its own box, its children list box and its children's node boxes, in source order. */
const families = (page: Page) =>
  page.locator(".ds-tree").evaluate((tree) => {
    const box = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    };
    return [...tree.querySelectorAll("li")]
      .filter((li) => li.querySelector(":scope > ul"))
      .map((li) => ({
        label: li.querySelector(":scope > .ds-tree-node")!.textContent,
        parent: box(li.querySelector(":scope > .ds-tree-node")!),
        list: box(li.querySelector(":scope > ul")!),
        children: [...li.querySelectorAll(":scope > ul > li > .ds-tree-node")].map(box),
      }));
  });

for (const theme of THEMES) {
  test(`TREE-06 left-right puts every child right of its parent, ${theme}`, async ({ page }) => {
    await openTree(page, theme, 1200, { root: WIDE, layout: "left-right" });
    const fams = await families(page);
    expect(fams).toHaveLength(6);
    for (const f of fams) for (const c of f.children) expect(c.left, f.label!).toBeGreaterThan(f.parent.right);
  });

  test(`TREE-07 left-right stacks siblings top to bottom in source order, ${theme}`, async ({ page }) => {
    await openTree(page, theme, 1200, { root: WIDE, layout: "left-right" });
    for (const f of await families(page)) {
      expect(f.children.length, f.label!).toBeGreaterThan(1);
      for (let i = 1; i < f.children.length; i++) {
        expect(f.children[i].top, `${f.label} child ${i}`).toBeGreaterThanOrEqual(f.children[i - 1].bottom);
      }
    }
  });

  test(`TREE-08 left-right centres each parent on the box of its children list, ${theme}`, async ({ page }) => {
    // Uneven subtrees: the first branch has four leaves, the others two.
    await openTree(page, theme, 1200, { root: WIDE, layout: "left-right" });
    for (const f of await families(page)) {
      const parent = (f.parent.top + f.parent.bottom) / 2;
      const list = (f.list.top + f.list.bottom) / 2;
      expect(Math.abs(parent - list), f.label!).toBeLessThanOrEqual(1);
    }
  });

  test(`TREE-09 a left-right tree wider than its box scrolls from its first to its last node, ${theme}`, async ({
    page,
  }) => {
    await openTree(page, theme, 320, { root: WIDE, layout: "left-right" });
    let m = await measure(page);
    expect(m.overflows, "the tree is wider than its box").toBe(true);
    expect(m.scrollLeft).toBe(0);
    expect(m.left).toBeGreaterThanOrEqual(m.inner.left);
    await page.locator(".ds-tree").evaluate((tree) => (tree.scrollLeft = tree.scrollWidth));
    m = await measure(page);
    expect(m.scrollLeft).toBeGreaterThan(0);
    expect(m.right).toBeLessThanOrEqual(m.inner.right);
  });
}

/** What `property: value` computes to on the page: a token as the browser reads it. */
const computed = (page: Page, property: string, value: string) =>
  page.evaluate(
    ([p, v]) => {
      const probe = document.body.appendChild(document.createElement("i"));
      probe.style.setProperty(p, v);
      const out = getComputedStyle(probe).getPropertyValue(p);
      probe.remove();
      return out;
    },
    [property, value],
  );

/**
 * Every non-root node of a folder tree: its box, its parent's box, its row (`li`), the elbow drawn by its `::before`
 * and the rail drawn by its row's `::after`, with the borders that draw them.
 */
const elbows = (page: Page) =>
  page.locator(".ds-tree").evaluate((tree) => {
    const px = (v: string) => parseFloat(v) || 0;
    const sides = (cs: CSSStyleDeclaration) =>
      Object.fromEntries(
        (["Top", "Right", "Bottom", "Left"] as const).map((k) => [
          k.toLowerCase(),
          { style: cs[`border${k}Style`], width: cs[`border${k}Width`], color: cs[`border${k}Color`] },
        ]),
      );
    return [...tree.querySelectorAll("ul ul > li")].map((li) => {
      const node = li.querySelector(":scope > .ds-tree-node")!;
      const n = node.getBoundingClientRect();
      const ncs = getComputedStyle(node);
      const b = getComputedStyle(node, "::before");
      // The elbow is absolutely placed in the node's padding box.
      const x = n.left + px(ncs.borderLeftWidth) + px(b.left);
      const y = n.top + px(ncs.borderTopWidth) + px(b.top);
      const a = getComputedStyle(li, "::after");
      const l = li.getBoundingClientRect();
      const p = li.parentElement!.parentElement!.querySelector(":scope > .ds-tree-node")!.getBoundingClientRect();
      return {
        label: node.textContent,
        first: !li.previousElementSibling,
        last: !li.nextElementSibling,
        node: { left: n.left, top: n.top, bottom: n.bottom, centre: (n.top + n.bottom) / 2 },
        parent: { left: p.left, bottom: p.bottom },
        row: { top: l.top, bottom: l.bottom, left: l.left },
        elbow: {
          content: b.content,
          left: x,
          right: x + px(b.width),
          top: y,
          bottom: y + px(b.height),
          border: sides(b),
        },
        rail: { display: a.display, left: l.left + px(a.left), height: px(a.height), border: sides(a) },
      };
    });
  });

for (const theme of THEMES) {
  test(`TREE-10 folder puts each node on its own row in depth-first order, ${theme}`, async ({ page }) => {
    await openTree(page, theme, 640, { root: WIDE, layout: "folder" });
    const nodes = await page
      .locator(".ds-tree .ds-tree-node")
      .evaluateAll((els) => els.map((e) => ({ label: e.textContent, ...e.getBoundingClientRect().toJSON() })));
    expect(nodes.map((n) => n.label)).toEqual([
      "Esforço de teste",
      "Produto",
      "Qualidade da base de teste",
      "Tamanho do produto",
      "Complexidade do domínio",
      "Requisitos de qualidade (ex.: alta confiabilidade)",
      "Processo de desenvolvimento",
      "Estabilidade e maturidade do processo",
      "Modelo de desenvolvimento",
      "Fatores materiais (ex.: ferramentas)",
      "Pessoas",
      "Satisfação da equipe",
      "Habilidades e experiência",
      "Resultados do teste",
      "Gravidade dos defeitos",
      "Quantidade de retrabalho",
      "Contexto do teste",
      "Complexidade do projeto",
      "Trabalho local ou remoto",
    ]);
    for (let i = 1; i < nodes.length; i++) {
      expect(nodes[i].top, nodes[i].label).toBeGreaterThanOrEqual(nodes[i - 1].bottom);
    }
    const m = await measure(page);
    expect(m.overflows, "no sideways scroll at 640 px").toBe(false);
  });

  test(`TREE-11 folder indents each child 24 px from its parent, the root at the left edge, ${theme}`, async ({
    page,
  }) => {
    await openTree(page, theme, 640, { root: WIDE, layout: "folder" });
    const m = await measure(page);
    expect(Math.abs(m.root.left - m.inner.left)).toBeLessThanOrEqual(1);
    const fams = await families(page);
    expect(fams).toHaveLength(6);
    for (const f of fams) {
      for (const c of f.children) expect(Math.abs(c.left - f.parent.left - 24), f.label!).toBeLessThanOrEqual(1);
    }
  });

  test(`TREE-12 folder joins each node to its parent with a hairline elbow in the rule color, ${theme}`, async ({
    page,
  }) => {
    await openTree(page, theme, 640, { root: WIDE, layout: "folder" });
    // A border width computes to 0 without a border style, so the token is read on a solid border.
    const hair = await page.evaluate(() => {
      const probe = document.body.appendChild(document.createElement("i"));
      probe.style.borderLeft = "var(--ds-stroke-hair) solid";
      const out = getComputedStyle(probe).borderLeftWidth;
      probe.remove();
      return out;
    });
    const rule = await computed(page, "color", "var(--ds-rule)");
    const all = await elbows(page);
    expect(all).toHaveLength(18);
    for (const e of all) {
      const at = e.label!;
      // The elbow: a vertical and a horizontal hairline in --ds-rule, nothing on its top and right.
      for (const side of ["left", "bottom"]) {
        expect(e.elbow.border[side], `${at} ${side}`).toEqual({ style: "solid", width: hair, color: rule });
      }
      for (const side of ["top", "right"]) expect(e.elbow.border[side].style, `${at} ${side}`).toBe("none");
      // It drops from the parent's rail, 12 px in from the parent's left edge, to the node's vertical centre, then
      // runs to the node's left edge.
      expect(Math.abs(e.elbow.left - (e.parent.left + 12)), `${at} rail x`).toBeLessThanOrEqual(1);
      expect(Math.abs(e.elbow.bottom - e.node.centre), `${at} reaches the centre`).toBeLessThanOrEqual(1);
      expect(Math.abs(e.elbow.right - e.node.left), `${at} reaches the node`).toBeLessThanOrEqual(1);
      expect(Math.abs(e.elbow.top - e.row.top), `${at} starts at the top of its row`).toBeLessThanOrEqual(1);
      // The first child's row starts under its parent's box; later rows continue the rail of the row above.
      if (e.first) expect(Math.abs(e.row.top - e.parent.bottom), `${at} under its parent`).toBeLessThanOrEqual(1);
      if (!e.last) {
        expect(e.rail.display, `${at} rail`).not.toBe("none");
        expect(e.rail.border.left, `${at} rail`).toEqual({ style: "solid", width: hair, color: rule });
        expect(Math.abs(e.rail.left - e.elbow.left), `${at} rail x`).toBeLessThanOrEqual(1);
        expect(Math.abs(e.rail.height - (e.row.bottom - e.row.top)), `${at} rail spans the row`).toBeLessThanOrEqual(1);
      }
    }
  });

  test(`TREE-13 folder draws no rail below a parent's last child, ${theme}`, async ({ page }) => {
    await openTree(page, theme, 640, { root: WIDE, layout: "folder" });
    const last = (await elbows(page)).filter((e) => e.last);
    expect(last).toHaveLength(6);
    for (const e of last) {
      expect(e.rail.display, e.label!).toBe("none");
      expect(Math.abs(e.elbow.bottom - e.node.centre), e.label!).toBeLessThanOrEqual(1);
    }
  });
}

for (const layout of ["left-right", "folder"] as const) {
  test(`TREE-19 a ${layout} tree narrower than its box starts at the box's left edge`, async ({ page }) => {
    for (const theme of THEMES) {
      await openTree(page, theme, 900, { root: WIDE, layout });
      const m = await measure(page);
      expect(m.overflows, theme).toBe(false);
      expect(Math.abs(m.root.left - m.inner.left), theme).toBeLessThanOrEqual(1);
      expect(Math.abs(m.left - m.inner.left), theme).toBeLessThanOrEqual(1);
    }
  });
}

for (const layout of ["top-down", "left-right", "folder"] as const) {
  test(`TREE-14 the root keeps the inverse fill and the active node the signal fill, ${layout}`, async ({ page }) => {
    for (const theme of THEMES) {
      await openTree(page, theme, 900, {
        root: { label: "Root", children: [{ label: "On", active: true }, { label: "Off" }] },
        layout,
      });
      const fills = await page
        .locator(".ds-tree-node")
        .evaluateAll((els) => els.map((e) => getComputedStyle(e).backgroundColor));
      const want = await Promise.all(
        ["var(--ds-inverse)", "var(--ds-signal)", "var(--ds-paper)"].map((v) => computed(page, "background-color", v)),
      );
      expect(fills, theme).toEqual(want);
    }
  });

  test(`TREE-18 a single node draws no connector, ${layout}`, async ({ page }) => {
    await openTree(page, "paper", 900, { root: { label: "Alone" }, layout });
    const marks = await page.locator(".ds-tree").evaluate((tree) => {
      const drawn = (el: Element, pseudo: string) => {
        const cs = getComputedStyle(el, pseudo);
        return cs.content !== "none" && cs.display !== "none";
      };
      const els = [...tree.querySelectorAll("ul, li, .ds-tree-node")];
      return els.flatMap((el) => ["::before", "::after"].filter((p) => drawn(el, p)).map((p) => el.tagName + p));
    });
    expect(marks).toEqual([]);
  });
}
