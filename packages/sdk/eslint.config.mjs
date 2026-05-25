// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import n from "eslint-plugin-n";

export default tseslint.config(
  { ignores: ["dist", "src/gen", "node_modules"] },
  { linterOptions: { reportUnusedDisableDirectives: "error" } },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  n.configs["flat/recommended"],
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "n/no-missing-import": "off",
      "n/no-unsupported-features/node-builtins": "off", // fetch/Request/Response stable since 18.17.
    },
  },
);
