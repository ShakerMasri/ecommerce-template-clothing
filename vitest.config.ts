import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const serverOnlyMock = fileURLToPath(
  new URL("./src/test/mocks/server-only.ts", import.meta.url),
);

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    alias: {
      "server-only": serverOnlyMock,
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*"],
      exclude: ["src/**/*.d.ts", "src/test/**", "src/types/**"],
    },
  },
});
