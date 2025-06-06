import path from "node:path";
import { defineConfig } from "vite";
import topLevelAwait from "vite-plugin-top-level-await";
import wasm from "vite-plugin-wasm";
import "vitest/config";

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "ic_vetkd_sdk_encrypted_maps",
      formats: ["es", "umd"],
      fileName: (format) => `ic_vetkd_sdk_encrypted_maps.${format}.js`,
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
      },
    },
  },
  plugins: [wasm(), topLevelAwait()],
  esbuild: {
    supported: {
      "top-level-await": true, //browsers can handle top-level-await features
    },
  },
  test: {
    environment: "happy-dom",
    setupFiles: ["test/setup.ts"],
    testTimeout: 60000,
  },
});
