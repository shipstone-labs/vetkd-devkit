import { defineConfig } from 'vitest/config'
import path from 'path';
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
    plugins: [
        wasm(),
        topLevelAwait()
    ],
    test: {
        testTimeout: 60000
    }
});