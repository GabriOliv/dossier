import { defineConfig } from "vite";

/** Library build: one ESM file, React left to the consumer. CSS is built by scripts/build-css.mjs. */
export default defineConfig({
  esbuild: { jsx: "automatic" },
  build: {
    lib: { entry: "src/index.ts", formats: ["es"], fileName: () => "index.js" },
    outDir: "dist",
    emptyOutDir: false,
    minify: false,
    sourcemap: false,
    rollupOptions: { external: [/^react($|\/)/] },
  },
});
