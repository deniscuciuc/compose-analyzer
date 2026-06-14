import { existsSync, readFileSync } from "node:fs";

import { ImageAnalyzer } from "../analyzers/image-analyzer";
import { NetworkAnalyzer } from "../analyzers/network-analyzer";
import { ReliabilityAnalyzer } from "../analyzers/reliability-analyzer";
import { ResourceAnalyzer } from "../analyzers/resource-analyzer";
import { SecurityAnalyzer } from "../analyzers/security-analyzer";
import { ComposeCollector } from "../collectors/compose-collector";
import { DockerCollector } from "../collectors/docker-collector";
import { type Command, SEVERITY_ORDER } from "../constants";
import { computeHealthScore } from "../health-score";
import * as display from "../interactive/display";
import { DiffReporter } from "../reporters/diff-reporter";
import { ReportGenerator } from "../reporters/report-generator";
import type { ComposeIssue, FullComposeReport, Recommendation } from "../types";
import type { ParsedOptions } from "./options";

export async function buildFullReport(
	options: ParsedOptions,
): Promise<FullComposeReport> {
	const collector = new ComposeCollector(options.composeFile);
	const composeFile = collector.getFile();
	const services = collector.getServices();

	const images = new ImageAnalyzer().analyze(services);
	const security = new SecurityAnalyzer().analyze(services);
	const reliability = new ReliabilityAnalyzer().analyze(services);
	const resources = new ResourceAnalyzer().analyze(services);
	const networks = new NetworkAnalyzer().analyze(
		services,
		composeFile.networks,
	);

	const allIssues = sortIssues([
		...images.issues,
		...security.issues,
		...reliability.issues,
		...resources.issues,
		...networks.issues,
	]);

	const metrics = {
		totalServices: services.length,
		servicesWithBuild: services.filter(({ service }) => Boolean(service.build))
			.length,
		namedVolumes: Object.keys(composeFile.volumes ?? {}).length,
		totalIssues: allIssues.length,
		criticalIssues: allIssues.filter((issue) => issue.severity === "critical")
			.length,
		highIssues: allIssues.filter((issue) => issue.severity === "high").length,
	};

	const report: FullComposeReport = {
		generatedAt: new Date(),
		composeFile: collector.getFilePath(),
		version: composeFile.version,
		healthScore: computeHealthScore(allIssues, services.length),
		metrics,
		images,
		security,
		reliability,
		resources,
		networks,
		allIssues,
		recommendations: buildRecommendations(allIssues),
	};

	if (options.withDocker) {
		report.dockerRuntime = await new DockerCollector().collect(services);
	}

	return report;
}

export async function executeCommand(options: ParsedOptions): Promise<void> {
	const log = options.quiet || options.json ? () => {} : console.log;
	const report = await buildFullReport(options);

	if (options.command !== "full") {
		const result = buildCommandResult(report, options.command);
		if (options.json) {
			console.log(JSON.stringify(result, null, 2));
			return;
		}

		renderCommand(report, options.command);
		return;
	}

	if (options.compare) {
		const previous = loadPreviousReport(options.compare);
		DiffReporter.print(
			DiffReporter.diff(report, previous),
			options.json ? console.error : console.log,
		);
	}

	if (options.json) {
		console.log(
			JSON.stringify(
				{
					success: true,
					report,
					summary: {
						healthScore: report.healthScore,
						totalServices: report.metrics.totalServices,
						totalIssues: report.metrics.totalIssues,
						criticalIssues: report.metrics.criticalIssues,
						highIssues: report.metrics.highIssues,
					},
					recommendations: report.recommendations,
				},
				null,
				2,
			),
		);
		return;
	}

	const reporter = new ReportGenerator(options.outputDir, options);
	reporter.printSummary(report);

	log("\nGenerating reports...");
	const [markdown, json, html] = await Promise.all([
		reporter.generateFullReport(report),
		reporter.generateJsonReport(report),
		options.html ? reporter.generateHtmlReport(report) : undefined,
	]);

	log("\nReports generated:");
	log(`  - Markdown: ${markdown}`);
	log(`  - JSON: ${json}`);
	if (html) {
		log(`  - HTML: ${html}`);
	}
}

export function loadPreviousReport(comparePath: string): FullComposeReport {
	if (!existsSync(comparePath)) {
		throw new Error(`Compare report not found: ${comparePath}`);
	}

	const parsed = JSON.parse(readFileSync(comparePath, "utf-8")) as unknown;
	if (
		typeof parsed === "object" &&
		parsed !== null &&
		"report" in parsed &&
		parsed.report
	) {
		return parsed.report as FullComposeReport;
	}

	return parsed as FullComposeReport;
}

function buildRecommendations(issues: ComposeIssue[]): Recommendation[] {
	const seen = new Set<string>();
	const recommendations: Recommendation[] = [];

	for (const issue of issues) {
		const key = `${issue.service}:${issue.title}`;
		if (seen.has(key)) {
			continue;
		}

		seen.add(key);
		recommendations.push({
			priority: issue.severity,
			service: issue.service,
			message: `${issue.title} — ${issue.detail}`,
			fix: issue.fix,
		});
	}

	return recommendations;
}

function sortIssues(issues: ComposeIssue[]): ComposeIssue[] {
	return [...issues].sort((left, right) => {
		const severityDelta =
			SEVERITY_ORDER[left.severity] - SEVERITY_ORDER[right.severity];
		if (severityDelta !== 0) {
			return severityDelta;
		}

		const serviceDelta = left.service.localeCompare(right.service);
		if (serviceDelta !== 0) {
			return serviceDelta;
		}

		return left.title.localeCompare(right.title);
	});
}

function buildCommandResult(
	report: FullComposeReport,
	command: Command,
): unknown {
	switch (command) {
		case "health":
			return {
				healthScore: report.healthScore,
				metrics: report.metrics,
				issues: report.allIssues.map(
					(issue) => `[${issue.severity}] ${issue.service}: ${issue.title}`,
				),
				recommendations: report.recommendations,
			};
		case "images":
			return report.images;
		case "security":
			return report.security;
		case "reliability":
			return report.reliability;
		case "resources":
			return report.resources;
		case "networks":
			return report.networks;
		default:
			return report;
	}
}

function renderCommand(report: FullComposeReport, command: Command): void {
	switch (command) {
		case "health":
			display.showHealth(report);
			break;
		case "images":
			display.showImages(report.images);
			break;
		case "security":
			display.showSecurity(report.security);
			break;
		case "reliability":
			display.showReliability(report.reliability);
			break;
		case "resources":
			display.showResources(report.resources);
			break;
		case "networks":
			display.showNetworks(report.networks);
			break;
		case "full":
			display.showFullReportSummary(report);
			break;
	}
}
