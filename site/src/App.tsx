import { useState } from "react";
import { Button, DataHeader, Grid, Readout, SectionTitle, Stack, Timeline } from "@gabrioliv/dossier";

const THEMES = ["paper", "void", "blueprint"] as const;
type Theme = (typeof THEMES)[number];
const LABEL: Record<Theme, string> = {
  paper: "Paper",
  void: "Void",
  blueprint: "Blueprint",
};

const INSTALL = `npm install https://github.com/GabriOliv/dossier/releases/download/v${__VERSION__}/gabrioliv-dossier-${__VERSION__}.tgz`;

const VITE = `import "@gabrioliv/dossier/styles.css";
import "@gabrioliv/dossier/base.css"; // optional: only in an app built entirely in Dossier
import { DataHeader, Readout } from "@gabrioliv/dossier";

export function Page() {
  return (
    <>
      <DataHeader title="Run 0427" code="File 0427 · Rev B" kicker="Section 01" />
      <Readout label="Pass rate" value="98.6" unit="%" tone="signal" />
    </>
  );
}`;

const DOCUSAURUS = `// docusaurus.config.ts, in the classic preset
theme: {
  customCss: [require.resolve("@gabrioliv/dossier/docusaurus.css"), "./src/css/custom.css"],
},

// any .mdx page
import { Readout } from "@gabrioliv/dossier";

<Readout label="Pass rate" value="98.6" unit="%" />`;

function initialTheme(): Theme {
  const t = document.documentElement.dataset.theme;
  return THEMES.find((x) => x === t) ?? "paper";
}

export function App() {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const pick = (t: Theme) => {
    setTheme(t);
    document.documentElement.dataset.theme = t;
  };
  return (
    <div className="site-wrap">
      <DataHeader
        title="Dossier"
        code="@gabrioliv/dossier"
        kicker="Design system for React"
        meta={`Version ${__VERSION__}`}
      />
      <main>
        <div className="site-top">
          <div className="site-actions">
            <a className="ds-t-label ds-btn ds-btn-solid" href="storybook/">
              Open the Storybook
            </a>
          </div>
          <div className="site-actions" role="group" aria-label="Theme">
            {THEMES.map((t) => (
              <Button
                key={t}
                size="sm"
                variant={theme === t ? "solid" : "outline"}
                aria-pressed={theme === t}
                onClick={() => pick(t)}
              >
                {LABEL[t]}
              </Button>
            ))}
          </div>
        </div>
        <p className="ds-t-body site-prose">
          Components, tokens and ready-made CSS for React, in three themes: Paper, Void and Blueprint. This page is
          built with the package.
        </p>

        <section className="site-section">
          <SectionTitle index="01" title="Live sample" level={2} />
          <Stack gap={6}>
            <Grid minColumnWidth={200}>
              <Readout label="Pass rate" value="98.6" unit="%" tone="signal" />
              <Readout label="Latency" value="124" unit="ms" trend="down" delta="-8 ms" />
              <Readout label="Open issues" value="17" trend="up" delta="+3" />
            </Grid>
            <Timeline
              events={[
                {
                  at: "Cycle 1",
                  label: "Survey",
                  note: "First readings logged",
                },
                {
                  at: "Cycle 10",
                  label: "Relay network",
                  note: "Four relays linked",
                },
                {
                  at: "Cycle 100",
                  label: "Core online",
                  note: "Network self-sustaining",
                  active: true,
                },
                {
                  at: "Cycle 1000",
                  label: "Projected",
                  note: "Model estimate",
                },
              ]}
            />
            <div className="site-actions">
              <Button>Review</Button>
              <Button variant="solid">Approve</Button>
              <Button variant="text">Dismiss</Button>
            </div>
          </Stack>
        </section>

        <section className="site-section">
          <SectionTitle index="02" title="Install" level={2} />
          <p className="ds-t-body site-prose">The package installs from the tarball attached to each release.</p>
          <pre className="site-code">
            <code>{INSTALL}</code>
          </pre>
        </section>

        <section className="site-section">
          <SectionTitle index="03" title="Quick usage" level={2} />
          <p className="ds-t-body site-prose">Vite, or any other bundler:</p>
          <pre className="site-code">
            <code>{VITE}</code>
          </pre>
          <p className="ds-t-body site-prose">Docusaurus:</p>
          <pre className="site-code">
            <code>{DOCUSAURUS}</code>
          </pre>
        </section>
      </main>
    </div>
  );
}
