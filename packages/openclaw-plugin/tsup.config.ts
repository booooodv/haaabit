import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  entry: ["src/index.ts"],
  external: ["zod"],
  format: ["esm"],
  outDir: "dist",
  sourcemap: false,
  splitting: false,
  target: "es2022",
});
