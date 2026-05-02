import { defineConfig } from "vite";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./src/manifest.config";

export default defineConfig({
  plugins: [crx({ manifest })],
  build: {
    target: "esnext",
    sourcemap: true,
    rollupOptions: {
      output: { chunkFileNames: "assets/[name]-[hash].js" },
    },
  },
  server: {
    port: 5180,
    strictPort: true,
    hmr: { port: 5181 },
  },
});
