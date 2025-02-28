import { defineConfig } from 'vitest/config'
import path from 'path';
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
    build: {
        lib: {
            entry: path.resolve(__dirname, 'src/index.ts'),
            name: 'ic_vetkd_sdk_key_manager',
            formats: ['es'],
            fileName: (format) => `ic_vetkd_sdk_key_manager.${format}.js`
        },
        rollupOptions: {
            external: [],
            output: {
                globals: {}
            }
        }
    },
    plugins: [
        wasm(),
        topLevelAwait()
    ],
    esbuild: {
        supported: {
            'top-level-await': true //browsers can handle top-level-await features
        },
    },
    test: {
        testTimeout: 60000
    }
});