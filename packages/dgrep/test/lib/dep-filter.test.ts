import { describe, it, expect } from "vitest";
import { isDevTool } from "../../src/lib/dep-filter.js";

describe("isDevTool", () => {
  // -- Should be filtered (dev tools) -----------------------------------

  it("filters @types/* packages", () => {
    expect(isDevTool("@types/react")).toBe(true);
    expect(isDevTool("@types/node")).toBe(true);
  });

  it("filters eslint and variants", () => {
    expect(isDevTool("eslint")).toBe(true);
    expect(isDevTool("eslint-plugin-react")).toBe(true);
    expect(isDevTool("eslint-config-next")).toBe(true);
    expect(isDevTool("@eslint/js")).toBe(true);
    expect(isDevTool("@typescript-eslint/parser")).toBe(true);
    expect(isDevTool("@typescript-eslint/eslint-plugin")).toBe(true);
  });

  it("filters prettier and variants", () => {
    expect(isDevTool("prettier")).toBe(true);
    expect(isDevTool("prettier-plugin-tailwindcss")).toBe(true);
  });

  it("filters babel and variants", () => {
    expect(isDevTool("@babel/core")).toBe(true);
    expect(isDevTool("babel-loader")).toBe(true);
    expect(isDevTool("babel-plugin-transform-runtime")).toBe(true);
  });

  it("filters webpack loaders and plugins", () => {
    expect(isDevTool("css-loader")).toBe(true);
    expect(isDevTool("style-loader")).toBe(true);
    expect(isDevTool("html-webpack-plugin")).toBe(true);
  });

  it("filters rollup and vite plugins", () => {
    expect(isDevTool("rollup-plugin-terser")).toBe(true);
    expect(isDevTool("vite-plugin-react")).toBe(true);
    expect(isDevTool("@vitejs/plugin-react")).toBe(true);
  });

  it("filters test frameworks", () => {
    expect(isDevTool("vitest")).toBe(true);
    expect(isDevTool("jest")).toBe(true);
    expect(isDevTool("mocha")).toBe(true);
    expect(isDevTool("chai")).toBe(true);
    expect(isDevTool("cypress")).toBe(true);
    expect(isDevTool("playwright")).toBe(true);
    expect(isDevTool("@testing-library/react")).toBe(true);
    expect(isDevTool("@vitest/ui")).toBe(true);
    expect(isDevTool("@jest/globals")).toBe(true);
    expect(isDevTool("@playwright/test")).toBe(true);
    expect(isDevTool("msw")).toBe(true);
  });

  it("filters build tools", () => {
    expect(isDevTool("typescript")).toBe(true);
    expect(isDevTool("tsx")).toBe(true);
    expect(isDevTool("ts-node")).toBe(true);
    expect(isDevTool("webpack")).toBe(true);
    expect(isDevTool("rollup")).toBe(true);
    expect(isDevTool("vite")).toBe(true);
    expect(isDevTool("esbuild")).toBe(true);
    expect(isDevTool("tsup")).toBe(true);
    expect(isDevTool("obuild")).toBe(true);
    expect(isDevTool("turbo")).toBe(true);
  });

  it("filters monorepo and task tools", () => {
    expect(isDevTool("nx")).toBe(true);
    expect(isDevTool("lerna")).toBe(true);
    expect(isDevTool("concurrently")).toBe(true);
    expect(isDevTool("npm-run-all")).toBe(true);
  });

  it("filters git hooks", () => {
    expect(isDevTool("husky")).toBe(true);
    expect(isDevTool("lint-staged")).toBe(true);
    expect(isDevTool("@commitlint/cli")).toBe(true);
  });

  it("filters misc dev tools", () => {
    expect(isDevTool("rimraf")).toBe(true);
    expect(isDevTool("cross-env")).toBe(true);
    expect(isDevTool("nodemon")).toBe(true);
    expect(isDevTool("globals")).toBe(true);
  });

  // -- Should NOT be filtered (real libraries) -----------------------------------

  it("keeps react and ecosystem", () => {
    expect(isDevTool("react")).toBe(false);
    expect(isDevTool("react-dom")).toBe(false);
    expect(isDevTool("react-router")).toBe(false);
  });

  it("keeps frameworks", () => {
    expect(isDevTool("next")).toBe(false);
    expect(isDevTool("express")).toBe(false);
    expect(isDevTool("hono")).toBe(false);
    expect(isDevTool("fastify")).toBe(false);
  });

  it("keeps ORMs and databases", () => {
    expect(isDevTool("drizzle-orm")).toBe(false);
    expect(isDevTool("prisma")).toBe(false);
    expect(isDevTool("mongoose")).toBe(false);
  });

  it("keeps utility libraries", () => {
    expect(isDevTool("zod")).toBe(false);
    expect(isDevTool("lodash")).toBe(false);
    expect(isDevTool("axios")).toBe(false);
    expect(isDevTool("date-fns")).toBe(false);
  });

  it("keeps CLI/UI libraries", () => {
    expect(isDevTool("yargs")).toBe(false);
    expect(isDevTool("@clack/prompts")).toBe(false);
    expect(isDevTool("picocolors")).toBe(false);
    expect(isDevTool("gray-matter")).toBe(false);
  });

  it("keeps auth and payment libraries", () => {
    expect(isDevTool("better-auth")).toBe(false);
    expect(isDevTool("stripe")).toBe(false);
    expect(isDevTool("@auth/core")).toBe(false);
  });
});
