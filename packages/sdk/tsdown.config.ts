import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  outDir: "dist",
  clean: true,
  sourcemap: true,
  publint: true,
  // attw disabled: 0.17-0.18 crash on fflate untar in this env; re-enable when upstream fixes.
  // attw: { profile: "node16" },
});
