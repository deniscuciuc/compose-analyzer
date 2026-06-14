# Docker Compose Analyzer

[![Node.js 20+](https://img.shields.io/badge/node-20%2B-339933?logo=node.js)](https://nodejs.org/)
[![npm version](https://img.shields.io/npm/v/@deniscuciuc/compose-analyzer?logo=npm&color=cb3837)](https://www.npmjs.com/package/@deniscuciuc/compose-analyzer)
[![npm downloads](https://img.shields.io/npm/dm/@deniscuciuc/compose-analyzer)](https://www.npmjs.com/package/@deniscuciuc/compose-analyzer)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![TypeScript](https://img.shields.io/badge/types-TypeScript-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![CI](https://github.com/deniscuciuc/compose-analyzer/actions/workflows/ci.yml/badge.svg)](https://github.com/deniscuciuc/compose-analyzer/actions/workflows/ci.yml)

A CLI that analyzes Docker Compose files for image hygiene, security risk, reliability gaps, resource limits, and network exposure. It emits JSON to stdout with `-j`, or writes Markdown/JSON/HTML reports to `./reports`.

## Quick start

No installation required:

```bash
npx @deniscuciuc/compose-analyzer -f docker-compose.yml -c health
npx @deniscuciuc/compose-analyzer -f docker-compose.yml -c full --html
```

Or install globally:

```bash
npm install -g @deniscuciuc/compose-analyzer
compose-analyzer -f docker-compose.yml -c security
```

---

## Features

- Unpinned image and `:latest` detection
- Plain-text secret detection in Compose environment variables
- Privileged container and exposed database port checks
- Missing healthcheck, weak `depends_on`, and restart policy analysis
- Missing CPU / memory limit detection for both legacy and deploy-based formats
- Default-network and random host-port publishing checks
- Markdown, JSON, HTML, and diffable report output
- Optional Docker runtime enrichment via `--with-docker`
- Interactive CLI mode for browsing analysis and report flows

## Requirements

- Node.js >= 20
- pnpm >= 10
- Any Docker Compose YAML file (`docker-compose.yml`, `compose.yml`, etc.)
- Optional: Docker socket access for `--with-docker`

## Usage

### Interactive mode

```bash
pnpm start -- --file docker-compose.yml
```

### npm scripts

```bash
pnpm analyze -- --file docker-compose.yml
pnpm analyze:health -- --file docker-compose.yml
pnpm analyze:security -- --file docker-compose.yml
pnpm analyze:html -- --file docker-compose.yml
pnpm test
```

### Direct CLI

```bash
node -r ts-node/register index.ts -f docker-compose.yml -j -c full
node -r ts-node/register index.ts -f docker-compose.yml -c images
node -r ts-node/register index.ts -f docker-compose.yml --with-docker -c full --html
```

## Commands

| Command | Description |
| --- | --- |
| `full` | Complete analysis and report generation (default) |
| `health` | Health score and issue summary |
| `images` | Image pinning and tag analysis |
| `security` | Secrets in env, privileged containers, and exposed DB ports |
| `reliability` | Healthchecks, `depends_on`, and restart policy analysis |
| `resources` | CPU and memory limit analysis |
| `networks` | Default network usage and risky port publishing |

## CLI options

| Option | Short | Description | Default |
| --- | --- | --- | --- |
| `--file` | `-f` | Path to Compose file | `docker-compose.yml` |
| `--with-docker` |  | Enrich the report with Docker daemon runtime status | `false` |
| `--compare` |  | Previous JSON report to diff against | — |
| `--html` |  | Also generate HTML for `full` | `false` |
| `--command` | `-c` | Command to run | `full` |
| `--json` | `-j` | Print JSON to stdout | `false` |
| `--output` | `-o` | Reports directory | `./reports` |
| `--interactive` | `-i` | Interactive menu | `false` |
| `--config` |  | Path to a config file (non-connection settings only) | auto-search |

> This tool intentionally has **no** watch mode and **no** connection/profile handling. It analyzes static files only.

## Configuration

Copy `analyzerrc.example.json` to `.analyzerrc.json` if you want a default reports directory:

```bash
cp analyzerrc.example.json .analyzerrc.json
```

Example:

```json
{
  "output": "./reports"
}
```

## Output formats

- **JSON** to stdout with `-j`
- **Markdown** report on `full`
- **HTML** report on `full --html`
- **Diff** summary with `--compare previous-report.json`

## Health score

Health starts at `100` and deductions are applied per issue severity:

- `critical`: -15
- `high`: -8
- `medium`: -4
- `low`: -1

Interpretation:

| Score | Status |
| --- | --- |
| `90–100` | Excellent |
| `70–89` | Good |
| `50–69` | Warning |
| `0–49` | Critical |

## Architecture

```text
index.ts
src/cli/{options,runner}.ts
src/config/loader.ts
src/collectors/{compose-collector,docker-collector}.ts
src/analyzers/*.ts
src/reporters/{report-generator,html-reporter,diff-reporter}.ts
src/interactive/{index,menus,display}.ts
src/utils/{format,print}.ts
```

## Development

```bash
pnpm install
pnpm lint
pnpm build
pnpm test
```
