import type { Decorator, Preview } from "@storybook/react-vite";
// Built CSS, like the gallery: run `npm run build` first (npm run storybook does it).
import "../dist/styles.css";
import "../dist/base.css";
import "./docs.css";

/** Themes the page and wraps the story in a themed block, so the Docs page (white by default) follows it too. */
const withTheme: Decorator = (Story, ctx) => {
  const theme = ctx.globals.theme as string;
  document.documentElement.dataset.theme = theme;
  return (
    <div data-theme={theme} style={{ background: "var(--ds-paper)", color: "var(--ds-ink)", padding: 24 }}>
      <Story />
    </div>
  );
};

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Dossier theme",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        dynamicTitle: true,
        items: [
          { value: "paper", title: "Paper" },
          { value: "void", title: "Void" },
          { value: "blueprint", title: "Blueprint" },
        ],
      },
    },
  },
  initialGlobals: { theme: "paper" },
  decorators: [withTheme],
  parameters: { layout: "fullscreen", controls: { expanded: true } },
};

export default preview;
