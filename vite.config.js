/*
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    global: "globalThis",  // ✅ Polyfill for "global" in browser
  },
});
*/

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import { NodeModulesPolyfillPlugin } from "@esbuild-plugins/node-modules-polyfill";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",        // ✅ Polyfill global
        "process.env": "{}",          // ✅ Minimal process.env
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true,              // ✅ Polyfill Buffer
          process: true,             // ✅ Polyfill process
        }),
        NodeModulesPolyfillPlugin(),
      ],
    },
  },
  resolve: {
    alias: {
      util: "rollup-plugin-node-polyfills/polyfills/util",
      stream: "rollup-plugin-node-polyfills/polyfills/stream",
      buffer: "rollup-plugin-node-polyfills/polyfills/buffer-es6",
      process: "rollup-plugin-node-polyfills/polyfills/process-es6",
      global: "rollup-plugin-node-polyfills/polyfills/global", // ✅ Ensure global polyfill
    },
  },
});
