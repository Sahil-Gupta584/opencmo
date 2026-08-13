import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/**/*", "!src/**/*.test.*"],
  format: ["cjs"],
  noExternal: ["@repo/backend", "@repo/database", "@repo/logger"],
  outExtensions: () => ({
    js: ".cjs"
  })
});
