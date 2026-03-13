import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  entry: ["src/index.ts"],
  format: ["esm"],
  noExternal: ["zod"],
  outDir: "dist",
  sourcemap: false,
  splitting: false,
  target: "es2022",
});
