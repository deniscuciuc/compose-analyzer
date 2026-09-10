import { COMMANDS, type Command, DEFAULTS } from "../constants";
import type { AnalyzerOptions } from "../types";

export interface ParsedOptions extends AnalyzerOptions {
	composeFile: string;
	compare?: string;
	command: Command;
	config?: string;
	interactive: boolean;
	json: boolean;
	outputDir?: string;
	quiet: boolean;
	version: boolean;
	help: boolean;
}

export function parseOptions(argv = process.argv.slice(2)): ParsedOptions {
	const options: ParsedOptions = {
		composeFile: DEFAULTS.composeFile,
		command: "full",
		interactive: false,
		json: false,
		quiet: false,
		version: false,
		help: false,
		withDocker: false,
		html: false,
	};

	for (let index = 0; index < argv.length; index++) {
		const token = argv[index];
		switch (token) {
			case "--file":
			case "-f":
				options.composeFile = requireValue(argv, ++index, token);
				break;
			case "--with-docker":
				options.withDocker = true;
				break;
			case "--compare":
				options.compare = requireValue(argv, ++index, token);
				break;
			case "--html":
				options.html = true;
				break;
			case "--command":
			case "-c": {
				const command = requireValue(argv, ++index, token);
				if (!COMMANDS.includes(command as Command)) {
					throw new Error(`Unknown command: ${command}`);
				}
				options.command = command as Command;
				break;
			}
			case "--json":
			case "-j":
				options.json = true;
				break;
			case "--output":
			case "-o":
				options.outputDir = requireValue(argv, ++index, token);
				break;
			case "--interactive":
			case "-i":
			case "start":
				options.interactive = true;
				break;
			case "--config":
				options.config = requireValue(argv, ++index, token);
				break;
			case "--quiet":
			case "-q":
				options.quiet = true;
				break;
			case "--version":
			case "-v":
				options.version = true;
				break;
			case "--help":
				printHelp();
				options.help = true;
				return options;
			default:
				if (token?.startsWith("-")) {
					throw new Error(`Unknown option: ${token}`);
				}
				throw new Error(`Unexpected argument: ${token}`);
		}
	}

	return options;
}

export function toAnalyzerOptions(options: ParsedOptions): AnalyzerOptions {
	return {
		outputDir: options.outputDir,
		withDocker: options.withDocker,
		quiet: options.quiet,
		html: options.html,
	};
}

function requireValue(argv: string[], index: number, flag: string): string {
	const value = argv[index];
	if (!value || value.startsWith("-")) {
		throw new Error(`Missing value for ${flag}`);
	}

	return value;
}

function printHelp(): void {
	console.log(`
Docker Compose Analyzer
=======================

Usage:
  npx @deniscuciuc/compose-analyzer [options]

Options:
  -f, --file <path>          Path to docker-compose file (default: ${DEFAULTS.composeFile})
      --with-docker          Enrich with Docker runtime status when the daemon is available
      --compare <path>       Compare against a previous JSON report
      --html                 Also generate an HTML report for full analysis
  -c, --command <command>    Command to run (default: full)
  -j, --json                 Output JSON to stdout
  -o, --output <dir>         Output directory for reports (default: ${DEFAULTS.output})
  -i, --interactive          Interactive menu
      --config <path>        Path to a config file (non-connection settings only)
  -q, --quiet                Suppress non-essential log output
  -v, --version              Print package version
      --help                 Show this help text

Commands:
  full
  health
  images
  security
  reliability
  resources
  networks

Notes:
  - This tool is a static file analyzer. There is no watch mode.
  - Config support is limited to non-connection settings such as output.
`);
}
