import typescript from "@rollup/plugin-typescript";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import autoprefixer from "autoprefixer";
import css from "rollup-plugin-css-only";
import tailwindcss from "tailwindcss";
import { defineConfig } from "vite";
import viteCompression from "vite-plugin-compression";
import environment from "vite-plugin-environment";
import eslint from "vite-plugin-eslint";
import topLevelAwait from "vite-plugin-top-level-await";
import wasm from "vite-plugin-wasm";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    wasm(),
    topLevelAwait(),
    css({ output: "bundle.css" }),
    eslint(),
    typescript({
      inlineSources: true,
    }),
    viteCompression(),
    environment("all", { prefix: "CANISTER_" }),
    environment("all", { prefix: "DFX_" }),
  ],
  esbuild: {
    supported: {
      "top-level-await": true, //browsers can handle top-level-await features
    },
  },
  css: {
    postcss: {
      plugins: [autoprefixer(), tailwindcss()],
    },
  },
  build: {
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
      sourcemap: true,
    },
  },
  root: "./",
  server: {
    hmr: false,
  },
});
