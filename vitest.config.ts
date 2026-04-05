import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./__tests__/setup.ts"],
    include: ["__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["app/api/**/*.ts", "app/lib/**/*.ts"],
      exclude: ["app/generated/**", "**/*.d.ts", "app/lib/db.ts"],
      thresholds: {
        statements: 95,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@/app": path.resolve(__dirname, "app"),
    },
  },
});
