import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
  base: "/jayce-the-champion/",
  plugins: [react()],
  test: { environment: "jsdom", setupFiles: "./tests/setup.ts" },
});
