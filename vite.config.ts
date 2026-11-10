import { defineConfig, type Plugin } from "vite";

/** Rollup drops module directives: this puts `"use client";` back on line 1 of each file whose module starts with it. */
export function keepUseClient(): Plugin {
  const client = new Set<string>();
  return {
    name: "keep-use-client",
    enforce: "pre",
    transform(code, id) {
      if (/^(?:\s|\/\/[^\n]*|\/\*[\s\S]*?\*\/)*["']use client["']/.test(code)) client.add(id);
    },
    banner: (chunk) => (chunk.facadeModuleId && client.has(chunk.facadeModuleId) ? '"use client";' : ""),
  };
}

/**
 * Library build: one ESM file per module of src, each with a sourcemap, React left to the consumer. CSS is built by
 * scripts/build-css.mjs.
 */
export default defineConfig({
  esbuild: { jsx: "automatic" },
  plugins: [keepUseClient()],
  build: {
    lib: {
      // The label sets are entries of their own: pt-BR is imported by no component.
      entry: {
        index: "src/index.ts",
        "locales/en": "src/locales/en.ts",
        "locales/pt-BR": "src/locales/pt-BR.ts",
      },
      formats: ["es"],
    },
    outDir: "dist",
    emptyOutDir: false,
    minify: false,
    sourcemap: true,
    rollupOptions: {
      external: [/^react($|\/)/],
      output: { preserveModules: true, preserveModulesRoot: "src", entryFileNames: "[name].js" },
      // Rollup warns that it drops "use client" (and that it cannot map that position, 1:0, in the sourcemap);
      // keepUseClient puts the directive back, so both warnings are noise.
      onwarn(warning, warn) {
        if (warning.code === "MODULE_LEVEL_DIRECTIVE" && warning.message.includes("use client")) return;
        if (warning.code === "SOURCEMAP_ERROR" && warning.pos === 0) return;
        warn(warning);
      },
    },
  },
});
