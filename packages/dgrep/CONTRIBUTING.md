# Contributing to dgrep

Thanks for your interest in contributing to dgrep! This project is MIT licensed and open to contributions.

## Getting Started

See [DEVELOPMENT.md](DEVELOPMENT.md) for local setup, project structure, testing, and build instructions.

## How to Contribute

1. Fork the repo and create a branch from `main`
2. Follow the commit format: `<type>(dgrep): <description>`
3. Ensure `pnpm --filter dgrep typecheck && pnpm --filter dgrep lint:check && pnpm --filter dgrep test` passes
4. Open a pull request

## What We're Looking For

- Bug fixes with reproduction steps
- Documentation improvements
- Test coverage for untested paths
- Performance improvements with benchmarks

## Reporting Issues

Open an issue at [github.com/docfork/docfork/issues](https://github.com/docfork/docfork/issues) with:
- dgrep version (`dgrep --version`)
- Node.js version (`node --version`)
- Steps to reproduce
- Expected vs actual behavior

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](../../LICENSE).
