import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const root = fileURLToPath(new URL(".", import.meta.url));
const repo = fileURLToPath(new URL("..", import.meta.url));
const { version } = JSON.parse(readFileSync(repo + "package.json", "utf8")) as {
  version: string;
};

/** The landing consumes the BUILT library (dist/), like any consumer. Run `npm run build` first. */
export default defineConfig({
  root,
  base: "/dossier/",
  plugins: [react()],
  define: { __VERSION__: JSON.stringify(version) },
  resolve: {
    alias: { "@gabrioliv/dossier": repo + "dist/index.js" },
    dedupe: ["react", "react-dom"],
  },
  build: { outDir: "dist", emptyOutDir: true },
});
