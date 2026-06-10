import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  server: {
    fs: {
      // the EIP-712 parity test imports the backend's type definition directly
      allow: [".."],
    },
  },
});
