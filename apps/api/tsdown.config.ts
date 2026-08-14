import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/**/*", "!src/**/*.test.*"],
  format: ["esm"],
  noExternal: ["@repo/backend", "@repo/database", "@repo/logger"]
});
