import { buildFullReport } from "./cli/runner";
import { DEFAULTS } from "./constants";
import { ReportGenerator } from "./reporters/report-generator";
import type { FullComposeReport } from "./types";

/** Settings for {@link ComposeAnalyzer}. */
export interface ComposeAnalyzerOptions {
	/** Path to the compose file. Defaults to `docker-compose.yml`. */
	composeFile?: string;
	/**
	 * Also inspect the Docker daemon and report the runtime state of each service.
	 * Requires a reachable daemon; the analysis still completes without one.
	 */
	withDocker?: boolean;
	/** Directory that {@link ComposeAnalyzer.generateReport} writes into. Defaults to `./reports`. */
	outputDir?: string;
	/** Suppress progress output. */
	quiet?: boolean;
}

/**
 * Programmatic entry point for the Docker Compose analyzer.
 *
 * Importing this module has no side effects — unlike the CLI entry point, which parses
 * argv and runs an analysis on import.
 *
 * ```ts
 * import { ComposeAnalyzer } from "@deniscuciuc/compose-analyzer";
 *
 * const analyzer = new ComposeAnalyzer({ composeFile: "docker-compose.prod.yml" });
 * const report = await analyzer.analyze();
 *
 * console.log(`Health: ${report.healthScore}/100`);
 * for (const issue of report.issues) {
 *   console.log(`[${issue.severity}] ${issue.service}: ${issue.title}`);
 * }
 * ```
 */
export class ComposeAnalyzer {
	private readonly options: Required<
		Pick<
			ComposeAnalyzerOptions,
			"composeFile" | "withDocker" | "outputDir" | "quiet"
		>
	>;

	constructor(options: ComposeAnalyzerOptions = {}) {
		this.options = {
			composeFile: options.composeFile ?? DEFAULTS.composeFile,
			withDocker: options.withDocker ?? false,
			outputDir: options.outputDir ?? DEFAULTS.output,
			quiet: options.quiet ?? true,
		};
	}

	/**
	 * Parses and analyses the compose file.
	 *
	 * @throws When the compose file cannot be found or parsed.
	 */
	analyze(): Promise<FullComposeReport> {
		return buildFullReport({
			...this.options,
			command: "full",
			interactive: false,
			json: false,
			version: false,
			html: false,
		} as never);
	}

	/**
	 * Writes a report to {@link ComposeAnalyzerOptions.outputDir}.
	 *
	 * @param format Output format. Defaults to `markdown`.
	 * @param report A report from {@link analyze}; one is generated if omitted.
	 * @returns The path of the file written.
	 */
	async generateReport(
		format: "markdown" | "json" | "html" = "markdown",
		report?: FullComposeReport,
	): Promise<string> {
		const resolved = report ?? (await this.analyze());
		const generator = new ReportGenerator(this.options.outputDir);

		switch (format) {
			case "json":
				return generator.generateJsonReport(resolved);
			case "html":
				return generator.generateHtmlReport(resolved);
			default:
				return generator.generateFullReport(resolved);
		}
	}
}
