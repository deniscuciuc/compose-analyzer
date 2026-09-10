# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

Only the latest release receives security fixes.

## Reporting a Vulnerability

**Please do not open a public issue for a security vulnerability.**

Report it through GitHub's private vulnerability reporting, which is the preferred channel:

<https://github.com/deniscuciuc/compose-analyzer/security/advisories/new>

If you cannot use GitHub, email **denis.cuciuc@zelqonworks.com** instead.

Please include a description and impact, steps to reproduce, the affected version, and any
suggested mitigation.

## What to Expect

| Stage | Target |
|---|---|
| Acknowledgement | Within 48 hours |
| Initial assessment | Within 5 working days |
| Fix for a high or critical issue | Within 30 days of triage |
| Fix for a moderate or low issue | Next scheduled release |

## Responsible Disclosure

Please give us a reasonable opportunity to release a fix before disclosing publicly. We will
credit you in the advisory and the changelog unless you prefer otherwise.

## Scope

This tool reads a Docker Compose file and, with `--with-docker`, connects to the local
Docker daemon over its socket. In scope:

- Anything that could execute code or commands as a result of parsing an untrusted compose
  file
- Anything that could send data from the Docker daemon somewhere it should not go
- Output escaping in the generated HTML reports, since service names, image tags and
  environment keys from the compose file are rendered into them
- Anything that could cause a secret found in a compose file to be written to a report or
  the terminal when it should be redacted

Out of scope: vulnerabilities in Docker itself or in `dockerode` — report those upstream,
though we would still like to know so we can pin or work around an affected version.

## Operational Notes

- This tool only ever reads. It never starts, stops or modifies containers, and it issues
  no write calls to the Docker daemon.
- `--with-docker` needs access to the Docker socket, which is equivalent to root on the
  host. Run it without that flag if you only need static analysis of the compose file.
- Compose files frequently contain secrets in `environment` blocks. Generated reports are
  written to `./reports` by default — treat them as sensitive and do not commit them.
