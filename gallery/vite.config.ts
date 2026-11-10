import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const root = fileURLToPath(new URL(".", import.meta.url));
const repo = fileURLToPath(new URL("..", import.meta.url));

/** The gallery consumes the BUILT library (dist/), like any consumer. Run `npm run build` first. */
export default defineConfig({
  root,
  base: "/dossier/",
  plugins: [react()],
  resolve: {
    alias: { "@gabrioliv/dossier": repo + "dist/index.js" },
    dedupe: ["react", "react-dom"],
  },
  build: { outDir: "dist", emptyOutDir: true },
});
