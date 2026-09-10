# Contributing

Contributions are welcome. Here is how to get started quickly.

## Prerequisites

- Node.js >= 22
- pnpm >= 10
- A Docker Compose file to analyze
- Optional: Docker daemon access if you want to use `--with-docker`

## Local setup

```bash
git clone https://github.com/deniscuciuc/compose-analyzer.git
cd compose-analyzer
pnpm install
cp analyzerrc.example.json .analyzerrc.json
pnpm build
node dist/index.js --help
```

## Development workflow

```bash
pnpm lint
pnpm build
pnpm test
pnpm lint:fix
```

## Submitting a pull request

1. Fork the repository and create a branch: `git checkout -b feat/my-change`
2. Make your changes
3. Run `pnpm lint && pnpm build && pnpm test`
4. Update `README.md` and `CHANGELOG.md` when behaviour or flags change
5. Open a PR against `main` with a clear description of the change and validation steps

## Coding standards

- TypeScript strict mode
- Biome formatting (tab indentation, enforced in CI)
- Avoid adding runtime dependencies unless they materially improve analyzer behaviour
- Keep the tool static-file-first: no watch mode and no connection profile handling
