import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const plain = process.env.DOSSIER === "0";

const config: Config = {
  title: "Dossier fixture",
  url: "http://127.0.0.1",
  baseUrl: "/",
  onBrokenLinks: "throw",
  i18n: { defaultLocale: "en", locales: ["en"] },
  markdown: { mermaid: true },
  themes: ["@docusaurus/theme-mermaid"],
  presets: [
    [
      "classic",
      {
        docs: {
          routeBasePath: "/",
          exclude: plain ? ["**/slice.mdx"] : [],
        },
        blog: false,
        theme: {
          customCss: plain
            ? ["./src/css/custom.css"]
            : [require.resolve("@gabrioliv/dossier/docusaurus.css"), "./src/css/custom.css"],
        },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    colorMode: { defaultMode: "light", respectPrefersColorScheme: false },
    navbar: { title: "Dossier fixture" },
    // A fake index: the tests answer the search request themselves, so no network is used.
    algolia: { appId: "FIXTUREAPP", apiKey: "fixture-key", indexName: "fixture", contextualSearch: false },
  } satisfies Preset.ThemeConfig,
};

export default config;
