![compose-analyzer](https://raw.githubusercontent.com/deniscuciuc/compose-analyzer/main/assets/banner.png)

# Docker Compose Analyzer

[![Node.js 22+](https://img.shields.io/badge/node-22%2B-339933?logo=node.js)](https://nodejs.org/)
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

- Node.js >= 22
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

## Programmatic usage

The package has two entry points. Importing it gives you the library and does nothing else;
the CLI is reached through the `compose-analyzer` binary.

```ts
import { ComposeAnalyzer } from "@deniscuciuc/compose-analyzer";

const analyzer = new ComposeAnalyzer({
  composeFile: "docker-compose.prod.yml",
  withDocker: true,   // also inspect the running containers
  outputDir: "./reports",
});

const report = await analyzer.analyze();

console.log(`Health: ${report.healthScore}/100`);
for (const issue of report.allIssues) {
  console.log(`[${issue.severity}] ${issue.service}: ${issue.title}`);
}

const path = await analyzer.generateReport("json", report);
```

### `ComposeAnalyzer`

| Member | Description |
|---|---|
| `new ComposeAnalyzer(options?)` | Reads nothing until `analyze()` is called. |
| `analyze()` | Parses and analyses the compose file, resolving to a `FullComposeReport`. |
| `generateReport(format?, report?)` | Writes a report and resolves to the file path. Generates one first if not supplied. |

| Option | Default | Description |
|---|---|---|
| `composeFile` | `docker-compose.yml` | Path to the compose file |
| `withDocker` | `false` | Also inspect the Docker daemon and report each service's runtime state |
| `outputDir` | `./reports` | Where `generateReport` writes |
| `quiet` | `true` | Suppress progress output |

The analyzers, collectors, reporters and every report type are exported too — see
[`src/index.ts`](src/index.ts) for the full surface.

## Architecture

```text
src/
├── cli/main.ts              # CLI entry point (the `compose-analyzer` binary)
├── index.ts                 # Library entry point, no side effects
├── api.ts                   # ComposeAnalyzer, the programmatic API
├── cli/{options,runner}.ts  # Argument parsing and command execution
├── config/loader.ts         # Config loading
├── constants.ts
├── types.ts                 # Shared types
├── health-score.ts          # Scoring from weighted issue severity
├── analyzers/
│   ├── image-analyzer.ts        # tags, pinning, build context
│   ├── security-analyzer.ts     # privileged mode, secrets in env
│   ├── reliability-analyzer.ts  # healthchecks, restart policies
│   ├── resource-analyzer.ts     # cpu and memory limits
│   └── network-analyzer.ts      # named networks, port bindings
├── collectors/
│   ├── compose-collector.ts     # parses and normalizes the compose file
│   └── docker-collector.ts      # optional live daemon state, via dockerode
├── interactive/{index,display,menus}.ts
└── reporters/{report-generator,html-reporter,diff-reporter}.ts
test/                        # Automated tests
```

## Development

```bash
pnpm install
pnpm lint
pnpm build
pnpm test
```
