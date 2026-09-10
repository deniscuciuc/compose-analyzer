/**
 * Library entry point for `@deniscuciuc/compose-analyzer`.
 *
 * Importing this module has no side effects. The CLI lives in `src/cli/main.ts` and is
 * reached through the `compose-analyzer` binary — importing the package used to parse argv
 * and run an analysis as a side effect of `require()`, because the CLI was the package
 * entry point.
 */

export { ImageAnalyzer } from "./analyzers/image-analyzer";
export { NetworkAnalyzer } from "./analyzers/network-analyzer";
export { ReliabilityAnalyzer } from "./analyzers/reliability-analyzer";
export { ResourceAnalyzer } from "./analyzers/resource-analyzer";
export { SecurityAnalyzer } from "./analyzers/security-analyzer";
export type { ComposeAnalyzerOptions } from "./api";
export { ComposeAnalyzer } from "./api";
export { ComposeCollector } from "./collectors/compose-collector";
export { DockerCollector } from "./collectors/docker-collector";
export type { Command } from "./constants";
export { COMMANDS, DEFAULTS } from "./constants";
export { computeHealthScore } from "./health-score";
export { DiffReporter } from "./reporters/diff-reporter";
export { HtmlReporter } from "./reporters/html-reporter";
export { ReportGenerator } from "./reporters/report-generator";

export type {
	AnalyzerConfig,
	AnalyzerOptions,
	ComposeCategory,
	ComposeFile,
	ComposeIssue,
	ComposeMetrics,
	ComposeService,
	ComposeSeverity,
	DockerRuntimeService,
	DockerRuntimeSummary,
	FullComposeReport,
	ImageAnalysis,
	NetworkAnalysis,
	NormalizedPort,
	Recommendation,
	ReliabilityAnalysis,
	ResourceAnalysis,
	SecurityAnalysis,
} from "./types";
