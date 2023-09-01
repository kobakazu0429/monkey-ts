import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    includeSource: ["{01,02,02refactor,03,04}/**/*.ts"],
  },
});
