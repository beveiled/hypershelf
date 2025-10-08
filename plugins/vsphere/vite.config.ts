/* eslint-disable import/no-extraneous-dependencies */
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import { viteStaticCopy } from "vite-plugin-static-copy";
import tsconfigPaths from "vite-tsconfig-paths";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");

const shared = {
  base: "",
  plugins: [
    react(),
    tsconfigPaths({
      projects: [
        path.join(repoRoot, "tsconfig.json"),
        path.join(__dirname, "tsconfig.json"),
      ],
    }),
    viteStaticCopy({ targets: [{ src: "manifest.json", dest: "." }] }),
  ],
  resolve: {
    alias: {
      "@": repoRoot,
      react: path.resolve(repoRoot, "node_modules/react"),
      "react-dom": path.resolve(repoRoot, "node_modules/react-dom"),
    },
    dedupe: ["react", "react-dom"] as string[],
  },
  esbuild: { charset: "ascii" },
} as const;

export default defineConfig(({ mode }) => {
  const isBg = mode === "bg";
  return {
    ...shared,
    plugins: [...shared.plugins, cssInjectedByJsPlugin()],
    build: {
      outDir: "dist",
      emptyOutDir: isBg,
      target: "es2020",
      cssCodeSplit: false,
      rollupOptions: {
        input: isBg
          ? path.resolve(__dirname, "src/background/index.ts")
          : path.resolve(__dirname, "src/content/vsphere.tsx"),
        output: isBg
          ? {
              format: "es",
              entryFileNames: "background/index.js",
              chunkFileNames: "assets/[name].js",
              assetFileNames: "assets/[name][extname]",
            }
          : {
              format: "iife",
              inlineDynamicImports: true,
              entryFileNames: "content/vsphere.js",
              chunkFileNames: "assets/[name].js",
              assetFileNames: "assets/[name][extname]",
            },
      },
    },
  };
});
