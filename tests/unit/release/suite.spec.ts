import { existsSync, readdirSync, readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

// The folders of the browser kinds; each holds spec files and their helpers.
const BROWSER = ["tests/component", "tests/visual", "tests/a11y", "tests/docs", "tests/site"];
const specs = (dir: string) =>
  (() => {
    try {
      return readdirSync(dir, { recursive: true, withFileTypes: true });
    } catch {
      return [];
    }
  })()
    .filter((e) => e.isFile() && e.name.endsWith(".spec.ts"))
    .map((e) => ({ file: `${e.parentPath}/${e.name}`, text: readFileSync(`${e.parentPath}/${e.name}`, "utf8") }));

/** Whether `id` opens a `test(` or `test.describe(` title in `text`, not a comment or another string. */
const titled = (text: string, id: string) =>
  new RegExp("test(?:\\.describe)?\\(\\s*[`\"'][^`\"'\\n]*(?<![A-Z0-9-])" + id + "(?![0-9])").test(text);

const ids = JSON.parse(readFileSync("tests/support/gallery-ids.json", "utf8")) as {
  ported: string[];
  "gallery-only": string[];
  "gallery-only-titles": string[];
};

// The pages of their own that a browser test may build with setContent, one reason each: every other test opens a story.
const OWN_PAGE: Record<string, string> = {
  "tests/component/forms.spec.ts":
    "design: the form components are measured on static form pages (Code Reuse Analysis)",
  "tests/component/release-1-1.spec.ts":
    "V11: a bare host page with dist/*.css and an unlayered a:hover, which no story has",
  "tests/a11y/axe.spec.ts": "A11Y-05 and A11Y-30 scan a page with a planted violation, which no story may carry",
  "tests/component/hierarchy-layouts.spec.ts":
    "TREE: a tree in a box of a fixed width, narrower or wider than the tree, in each layout, which no story has",
  "tests/component/figure.spec.ts": "FIG: a figure in a box of a fixed width with a long title, which no story has",
  "tests/component/bridge-katex.spec.ts":
    "BRG-05: a Docusaurus-like page with dist/docusaurus.css and a KaTeX formula, which no story has",
};

/** The functions of the browser test folders and their bodies, by name. */
const functions = (files: { text: string }[]) =>
  files.flatMap(({ text }) =>
    [...text.matchAll(/^(?:export )?(?:async )?function (\w+)[^\n]*\n([\s\S]*?)\n\}/gm)].map((m) => ({
      name: m[1],
      body: m[2],
    })),
  );

/** Every `test(` of a file with its title and body; a body runs to the next `test(`. */
const blocks = (text: string) => {
  const starts = [...text.matchAll(/^[ \t]*test\(/gm)].map((m) => m.index!);
  return starts.map((at, i) => {
    const body = text.slice(at, starts[i + 1] ?? text.length);
    return {
      title: body.match(/test\(\s*[`"']([^`"'\n]{0,60})/)?.[1] ?? body.slice(0, 40),
      body,
      // A browser test takes `page`, `browser` or `context` as a fixture.
      browser: /\bpage\b|\bbrowser\b|\bcontext\b/.test(body.match(/async\s*\(\s*\{([^}]*)\}/)?.[1] ?? ""),
    };
  });
};

test("SUI-03 each browser test of component, visual and a11y opens a story, or its file is on the own-page list", () => {
  const files = ["tests/component", "tests/visual", "tests/a11y", "tests/support"].flatMap(specs);
  const helpers = functions(
    ["tests/component", "tests/visual", "tests/a11y", "tests/support"].flatMap((dir) =>
      readdirSync(dir)
        .filter((f) => f.endsWith(".ts"))
        .map((f) => ({ text: readFileSync(`${dir}/${f}`, "utf8") })),
    ),
  );
  // A story opener is openStory, openAll or openOverlay, or a helper that calls one (to any depth).
  const openers = new Set(["openStory", "openAll", "openOverlay"]);
  for (let grew = true; grew; ) {
    grew = false;
    for (const h of helpers)
      if (!openers.has(h.name) && [...openers].some((o) => h.body.includes(`${o}(`))) {
        openers.add(h.name);
        grew = true;
      }
  }
  const calls = (body: string, names: Iterable<string>) => [...names].some((n) => new RegExp(`\\b${n}\\(`).test(body));
  const ownPage = new Set(helpers.filter((h) => /setContent\(/.test(h.body)).map((h) => h.name));

  const browserFiles = files.filter((f) => !f.file.startsWith("tests/support"));
  expect(browserFiles.length).toBeGreaterThan(10);
  expect(Object.keys(OWN_PAGE).every((f) => existsSync(f))).toBe(true);
  for (const reason of Object.values(OWN_PAGE)) expect(reason.length).toBeGreaterThan(10);
  const bad: string[] = [];
  for (const { file, text } of browserFiles) {
    const allowed = file in OWN_PAGE;
    // A page of its own, or a made-up address, is never a story.
    if (!allowed && /setContent\(|goto\("http:\/\/dossier\.test/.test(text)) bad.push(`${file}: builds its own page`);
    if (/\.goto\(\s*[`"'](\.|\?)/.test(text)) bad.push(`${file}: opens the gallery page`);
    for (const b of blocks(text).filter((x) => x.browser)) {
      const story = calls(b.body, openers);
      const own = allowed && (/setContent\(/.test(b.body) || calls(b.body, ownPage));
      if (!story && !own) bad.push(`${file}: "${b.title}" opens no story`);
    }
  }
  expect(bad).toEqual([]);
});

test("SUI-04 every ported gallery ID is a test title under tests/", () => {
  expect(ids.ported.length).toBeGreaterThan(90);
  const text = BROWSER.flatMap(specs)
    .map((s) => s.text)
    .join("\n");
  const missing = ids.ported.filter((id) => !titled(text, id));
  expect(missing).toEqual([]);
});

test("SUI-05 no gallery-only ID is a test title", () => {
  const text = BROWSER.flatMap(specs)
    .map((s) => s.text)
    .join("\n");
  expect(ids["gallery-only"].filter((id) => titled(text, id))).toEqual([]);
  for (const title of ids["gallery-only-titles"]) expect(text, title).not.toContain(title);
});
