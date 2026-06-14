# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
