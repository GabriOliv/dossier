import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { renderToStaticMarkup, renderToString } from "react-dom/server";
import { Figure } from "../../src/components/Figure";
import { en } from "../../src/locales/en";
import { ptBR } from "../../src/locales/pt-BR";
import { expectMarkup } from "./markup";
import { load, mount } from "./mount";
import { render } from "./oracle";

/** The text of the legend's title and meta spans. */
const parts = (html: string) => ({
  title: html.match(/<span class="ds-fig-title">([^<]*)<\/span>/)?.[1],
  meta: html.match(/<span class="ds-fig-meta">([^<]*)<\/span>/)?.[1],
});

test("VIS-11 Figure markup matches its snapshot", () => {
  expectMarkup("Figure", [
    [
      "number, title, meta, image and caption",
      render(
        <Figure n={3} title="Dossier structure" meta="Rev A">
          <img src="tree.svg" alt="The tree of the Dossier" />
          <figcaption>Tokens feed the components.</figcaption>
        </Figure>,
      ),
    ],
    ["legend only", render(<Figure n="12" title="Empty" />)],
  ]);
});

test("FIG-01 the legend reads FIG. and the number on two digits, a dash and the title, first in the figure", () => {
  const html = render(
    <Figure n={3} title="Dossier structure">
      <img src="a.svg" alt="" />
    </Figure>,
  );
  expect(html.startsWith('<figure class="ds-fig"><div class="ds-t-label ds-fig-legend">')).toBe(true);
  expect(parts(html).title).toBe("FIG. 03 — Dossier structure");
  expect(render(<Figure n="7" title="T" />)).toContain(">FIG. 07 — T<");
});

test("FIG-02 a number of three digits shows every digit", () => {
  expect(parts(render(<Figure n={100} title="Big" />)).title).toBe("FIG. 100 — Big");
});

test("FIG-03 a meta shows at the end of the legend, after the title", () => {
  const html = render(<Figure n={1} title="T" meta="Garden · Rev A" />);
  expect(parts(html).meta).toBe("Garden · Rev A");
  expect(html).toMatch(
    /<div class="ds-t-label ds-fig-legend"><span class="ds-fig-title">[^<]*<\/span><span class="ds-fig-meta">Garden · Rev A<\/span><\/div>/,
  );
});

test("FIG-04 without meta, or with an empty one, there is no meta element", () => {
  for (const html of [render(<Figure n={1} title="T" />), render(<Figure n={1} title="T" meta="" />)]) {
    expect(html).not.toContain("ds-fig-meta");
    expect(html).toMatch(
      /<div class="ds-t-label ds-fig-legend"><span class="ds-fig-title">FIG\. 01 — T<\/span><\/div>/,
    );
  }
});

test("FIG-08 labels.fig replaces the prefix; en and pt-BR both read FIG.", () => {
  expect(parts(render(<Figure n={2} title="T" labels={{ fig: "ABB." }} />)).title).toBe("ABB. 02 — T");
  expect(en.Figure).toEqual({ fig: "FIG." });
  expect(ptBR.Figure).toEqual({ fig: "FIG." });
  expect(parts(render(<Figure n={2} title="T" labels={ptBR.Figure} />)).title).toBe("FIG. 02 — T");
  // An empty label falls back to English, as every other label does.
  expect(parts(render(<Figure n={2} title="T" labels={{ fig: "" }} />)).title).toBe("FIG. 02 — T");
});

test("FIG-09 ref, native attributes and className reach the figure", async ({ page }) => {
  // renderToStaticMarkup, not render: render normalizes id-like values.
  const html = renderToStaticMarkup(
    <Figure n={1} title="T" id="f1" data-testid="fig" aria-describedby="d" className="wide" />,
  );
  expect(html.match(/^<figure [^>]*>/)![0]).toBe(
    '<figure class="ds-fig wide" id="f1" data-testid="fig" aria-describedby="d">',
  );
  for (const react19 of [false, true]) {
    await load(page, react19);
    const r = await mount(page, "Figure", { n: 1, title: "T" });
    expect({ ref: r.ref, refIsRoot: r.refIsRoot }, r.version).toEqual({ ref: "figure", refIsRoot: true });
  }
});

test("FIG-11 Figure renders on the server and is not a client component", () => {
  expect(readFileSync("src/components/Figure.tsx", "utf8")).not.toContain('"use client"');
  const html = renderToString(
    <Figure n={4} title="Server" meta="M">
      <figcaption>Caption</figcaption>
    </Figure>,
  );
  expect(html).toContain("FIG. 04 — Server");
  expect(html).toContain("<figcaption>Caption</figcaption>");
});

test("FIG-12 without children the figure holds the legend alone", () => {
  const html = render(<Figure n={5} title="Alone" meta="M" />);
  expect(html).toBe(
    '<figure class="ds-fig"><div class="ds-t-label ds-fig-legend"><span class="ds-fig-title">FIG. 05 — Alone</span><span class="ds-fig-meta">M</span></div></figure>',
  );
});

test("FIG-01 FIG-06 the children follow the legend in order", () => {
  const html = render(
    <Figure n={1} title="T">
      <img src="a.svg" alt="A" />
      <figcaption>Caption</figcaption>
    </Figure>,
  );
  expect(html).toMatch(/<\/div><img src="a\.svg" alt="A"\/><figcaption>Caption<\/figcaption><\/figure>$/);
});
