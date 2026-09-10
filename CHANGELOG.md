# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-09-10

### Added

- A programmatic API. `ComposeAnalyzer` is exported from the package root, alongside the
  analyzers, collectors, reporters and every report type. Importing the package now has no
  side effects — previously `require("@deniscuciuc/compose-analyzer")` parsed `process.argv`
  and ran an analysis, because the CLI was the package entry point and `main`/`types`
  pointed at it. The CLI moved to `src/cli/main.ts` and is still reached through the
  `compose-analyzer` binary.
- Nine tests covering the API, issue ordering, the missing-file path, and HTML escaping of
  hostile service names and issue titles.
- `SECURITY.md`, `CODE_OF_CONDUCT.md` and `CODEOWNERS`.

### Changed

- **The minimum supported Node.js version is now 22.** Node 20 reached end of life on
  30 April 2026.
- TypeScript 7 with `nodenext` module resolution, and `@types/node` named explicitly in
  `tsconfig.json` — TypeScript 7 no longer reliably auto-includes it.
- Stricter TypeScript (`noUncheckedIndexedAccess` and friends) and Biome rules; unused
  variables and imports are errors rather than warnings, and the lint scope now covers
  `test/` and `scripts/`.
- Updated `dockerode` to 5, `js-yaml` to 5, `@inquirer/prompts` and `@biomejs/biome`, and
  the GitHub Actions to their current majors. Verified against a live Docker daemon, not
  just a green type-check.
- Dropped `ts-node`, which is incompatible with TypeScript 7. The dev scripts and the CLI
  test now run the built output — the same code path that ships.
- Removed `@types/js-yaml`: js-yaml 5 bundles its own types, and keeping the v4 types
  alongside would have shadowed them with the previous API.
- CI runs on every branch rather than only `main` and `develop`, cancels superseded runs,
  and adds Node 24. Publishing emits npm provenance and verifies the tag matches
  `package.json`.

### Fixed

- `parseOptions` called `process.exit(0)` for `--help`, which made the parser untestable and
  left unreachable code after it. It sets a `help` flag and the caller decides.
- The entry point set `process.exitCode` instead of calling `process.exit`, which could
  truncate buffered stdout when piping `--json` to a file.
- Exposed `./package.json` through the `exports` map, so tooling that reads a dependency's
  manifest does not fail with `ERR_PACKAGE_PATH_NOT_EXPORTED`.

## [1.0.0] - 2026-06-14

### Added

- Docker Compose analyzer CLI with full, health, image, security, reliability, resource, and network commands
- YAML parsing for Compose v2, v3, and versionless files
- Image analysis for unpinned images and `:latest` tags
- Security analysis for secrets in environment variables, privileged containers, and exposed database ports
- Reliability analysis for healthchecks, `depends_on` conditions, and restart policies
- Resource analysis for missing CPU and memory limits
- Network analysis for default-network usage and random host port publishing
- Health score (0–100), Markdown/JSON/HTML reports, and report diffing
- Optional Docker daemon runtime enrichment with `--with-docker`
- Interactive CLI flows for analysis, reports, and settings
- Node built-in tests, GitHub Actions CI workflow, publish workflow, and OSS project metadata
