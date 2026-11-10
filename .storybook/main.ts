import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../stories/*.mdx", "../stories/*.stories.tsx"],
  addons: ["@storybook/addon-docs"],
  framework: {
    name: "@storybook/react-vite",
    // The root vite.config.ts is the library build (lib mode); Storybook must not inherit it.
    options: { builder: { viteConfigPath: ".storybook/vite.config.ts" } },
  },
  core: { disableTelemetry: true },
};

export default config;
