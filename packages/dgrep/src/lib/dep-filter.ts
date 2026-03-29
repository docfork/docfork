/**
 * Filters development tools and build dependencies from package lists.
 * Used by init and resolve-libraries to keep only actual libraries/frameworks.
 */

// Pattern-based filters — catch entire families of packages
const DEV_PATTERNS: RegExp[] = [
  /^@types\//,
  /^@eslint\//,
  /^eslint/,
  /^prettier/,
  /^@babel\//,
  /^babel-/,
  /^@typescript-eslint\//,
  /^@vitejs\//,
  /^@biomejs\//,
  /^@vitest\//,
  /^@testing-library\//,
  /^@commitlint\//,
  /^@jest\//,
  /^@playwright\//,
  /-loader$/,
  /-webpack-plugin$/,
  /^rollup-plugin-/,
  /^vite-plugin-/,
];

// Individual packages that don't match patterns
const DEV_NAMES = new Set([
  // TypeScript tooling
  "typescript",
  "tsx",
  "ts-node",
  "ts-jest",
  "@swc/core",
  "swc",
  // Bundlers
  "webpack",
  "rollup",
  "vite",
  "esbuild",
  "tsup",
  "obuild",
  "parcel",
  "turbopack",
  // Test frameworks
  "vitest",
  "jest",
  "mocha",
  "chai",
  "sinon",
  "playwright",
  "cypress",
  "nyc",
  "c8",
  "msw",
  // Monorepo / task runners
  "turbo",
  "nx",
  "lerna",
  "concurrently",
  "npm-run-all",
  // Git hooks
  "husky",
  "lint-staged",
  "commitlint",
  "pre-commit",
  // Misc dev tools
  "rimraf",
  "del-cli",
  "cross-env",
  "dotenv-cli",
  "nodemon",
  "globals",
  "biome",
  "oxlint",
]);

export function isDevTool(name: string): boolean {
  if (DEV_NAMES.has(name)) return true;
  for (const pattern of DEV_PATTERNS) {
    if (pattern.test(name)) return true;
  }
  return false;
}
