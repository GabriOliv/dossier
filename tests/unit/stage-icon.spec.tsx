import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { renderToStaticMarkup } from "react-dom/server";
import { StageIcon, type Stage } from "../../src/components/StageIcon";
import { en } from "../../src/locales/en";
import { ptBR } from "../../src/locales/pt-BR";
import { expectMarkup } from "./markup";

const FILES: Record<Stage, string> = { A: "a-semente", B: "b-broto", C: "c-arvore", D: "d-fruto" };

/** Elements of an SVG string as [tag, sorted attributes, text], so `<x></x>` and `<x/>` compare equal. */
function shape(svg: string) {
  const out: { tag: string; attrs: string[]; text: string }[] = [];
  for (const m of svg.matchAll(/<(\/?)([a-z]+)([^>]*?)\/?>([^<]*)/g)) {
    if (m[1]) continue;
    const attrs = [...m[3].matchAll(/([a-zA-Z:-]+)="([^"]*)"/g)].map(([, k, v]) => `${k}=${v}`).sort();
    out.push({ tag: m[2], attrs, text: m[4].trim() });
  }
  return out;
}

for (const stage of ["A", "B", "C", "D"] as Stage[]) {
  for (const [size, px] of [
    ["sm", 16],
    ["lg", 48],
  ] as const) {
    const file = `assets/stages/base/estagio-${FILES[stage]}-${px}.svg`;

    test(`STAGE-01 StageIcon ${stage} ${size} draws ${file} unchanged`, () => {
      // The asset files carry the QA Garden names, now the pt-BR labels (I18N-07).
      const html = renderToStaticMarkup(<StageIcon stage={stage} size={size} labels={ptBR.StageIcon} />);
      // The icon names the token --ds-signal (STY-15); the asset file keeps Dossier's --signal.
      const fromFile = shape(readFileSync(file, "utf8").replaceAll("var(--signal,", "var(--ds-signal,"));
      const fromIcon = shape(html);
      // The root differs only by the class hook.
      expect({ ...fromIcon[0], attrs: fromIcon[0].attrs.filter((a) => a !== "class=ds-stage") }).toEqual(fromFile[0]);
      expect(fromIcon[0].attrs).toContain("class=ds-stage");
      expect(fromIcon.slice(1)).toEqual(fromFile.slice(1));
    });
  }

  test(`STAGE-02 StageIcon ${stage} is named, or hidden when decorative`, () => {
    const named = renderToStaticMarkup(<StageIcon stage={stage} />);
    expect(named).toContain(`role="img" aria-label="${en.StageIcon[stage]}"`);
    expect(named).toContain(`<title>${en.StageIcon[stage]}</title>`);
    const hidden = renderToStaticMarkup(<StageIcon stage={stage} decorative className="x" />);
    expect(hidden).toContain('aria-hidden="true"');
    expect(hidden).toContain('class="ds-stage x"');
    expect(hidden).not.toContain("role=");
    expect(hidden).not.toContain("<title>");
  });
}

test("STAGE-03 base/ is the assets of the reference, and signal appears only on the fruit", () => {
  for (const stage of Object.values(FILES)) {
    for (const px of [16, 48]) {
      const name = `stages/base/estagio-${stage}-${px}.svg`;
      expect(readFileSync(`assets/${name}`, "utf8")).toBe(readFileSync(`source/assets/${name}`, "utf8"));
    }
  }
  for (const stage of ["A", "B", "C"] as Stage[]) {
    expect(renderToStaticMarkup(<StageIcon stage={stage} size="lg" />)).not.toContain("--signal");
  }
});

test("STAGE-04 an unknown stage renders nothing", () => {
  expect(renderToStaticMarkup(<StageIcon stage={"E" as Stage} />)).toBe("");
});

test("VIS-11 StageIcon markup matches its snapshot", () => {
  const cases: [string, string][] = (["A", "B", "C", "D"] as Stage[]).flatMap((stage) => [
    [`${stage} sm`, renderToStaticMarkup(<StageIcon stage={stage} size="sm" />)],
    [`${stage} lg`, renderToStaticMarkup(<StageIcon stage={stage} size="lg" />)],
    [`${stage} decorative`, renderToStaticMarkup(<StageIcon stage={stage} decorative className="x" />)],
  ]);
  expectMarkup("StageIcon", cases);
});
