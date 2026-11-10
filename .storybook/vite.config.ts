import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/** Storybook's own Vite config, kept apart from the library build in the root vite.config.ts. */
export default defineConfig({ plugins: [react()] });
