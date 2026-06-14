import * as fs from "node:fs";
import * as path from "node:path";
import type { AnalyzerOptions, FullComposeReport } from "../types";
import {
	healthEmoji,
	healthLabel,
	printBullet,
	printRow,
	printSection,
	printSubBullet,
} from "../utils/print";
import { HtmlReporter } from "./html-reporter";

export class ReportGenerator {
	constructor(
		private readonly outputDir: string = "./reports",
		_options: AnalyzerOptions = {},
	) {}

	async generateFullReport(
		report: FullComposeReport,
		timestamp?: string,
	): Promise<string> {
		const ts = timestamp ?? new Date().toISOString().replace(/[:.]/g, "-");
		const filename = `compose-analysis-${ts}.md`;
		const filepath = path.join(this.outputDir, filename);

		await this.ensureOutputDir();
		fs.writeFileSync(filepath, this.buildMarkdownReport(report));
		return filepath;
	}

	async generateJsonReport(
		report: FullComposeReport,
		timestamp?: string,
	): Promise<string> {
		const ts = timestamp ?? new Date().toISOString().replace(/[:.]/g, "-");
		const filename = `compose-analysis-${ts}.json`;
		const filepath = path.join(this.outputDir, filename);

		await this.ensureOutputDir();
		fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
		return filepath;
	}

	async generateHtmlReport(
		report: FullComposeReport,
		timestamp?: string,
	): Promise<string> {
		const ts = timestamp ?? new Date().toISOString().replace(/[:.]/g, "-");
		const filename = `compose-analysis-${ts}.html`;
		const filepath = path.join(this.outputDir, filename);

		await this.ensureOutputDir();
		fs.writeFileSync(filepath, HtmlReporter.generate(report));
		return filepath;
	}

	printSummary(report: FullComposeReport): void {
		printSection("Compose Analysis Summary");
		printRow(
			"Health score",
			`${report.healthScore}/100 ${healthEmoji(report.healthScore)} ${healthLabel(report.healthScore)}`,
		);
		printRow("Compose file", report.composeFile);
		printRow("Compose version", report.version ?? "not declared");
		printRow("Services", report.metrics.totalServices);
		printRow("Issues", report.metrics.totalIssues);
		printRow(
			"Critical / high",
			`${report.metrics.criticalIssues} / ${report.metrics.highIssues}`,
		);

		if (report.allIssues.length === 0) {
			printBullet("No issues detected.");
			return;
		}

		printBullet(`Top issues (${Math.min(report.allIssues.length, 5)} shown):`);
		for (const issue of report.allIssues.slice(0, 5)) {
			printSubBullet(`[${issue.severity}] ${issue.service} — ${issue.title}`);
		}
	}

	private async ensureOutputDir(): Promise<void> {
		if (!fs.existsSync(this.outputDir)) {
			fs.mkdirSync(this.outputDir, { recursive: true });
		}
	}

	private buildMarkdownReport(report: FullComposeReport): string {
		return [
			this.buildHeader(report),
			this.buildExecutiveSummary(report),
			this.buildMetricsSection(report),
			this.buildIssuesSection(report),
			this.buildImageSection(report),
			this.buildSecuritySection(report),
			this.buildReliabilitySection(report),
			this.buildResourceSection(report),
			this.buildNetworkSection(report),
			this.buildDockerRuntimeSection(report),
			this.buildRecommendationsSection(report),
		]
			.filter(Boolean)
			.join("\n\n");
	}

	private buildHeader(report: FullComposeReport): string {
		return `# Compose Analysis Report

**Compose file:** ${report.composeFile}
**Generated:** ${new Date(report.generatedAt).toISOString()}
**Tool:** Compose Analyzer

---`;
	}

	private buildExecutiveSummary(report: FullComposeReport): string {
		const findings = [
			report.metrics.criticalIssues > 0
				? `- **${report.metrics.criticalIssues}** critical issues need immediate attention`
				: "- No critical issues detected",
			report.metrics.highIssues > 0
				? `- **${report.metrics.highIssues}** high-severity issues should be prioritized`
				: "- No high-severity issues detected",
			report.images.unpinnedImages.length > 0
				? `- **${report.images.unpinnedImages.length}** services use unpinned images`
				: "- All image references are pinned or build-only",
			report.resources.missingLimits.length > 0
				? `- **${report.resources.missingLimits.length}** services are missing resource limits`
				: "- All services define CPU and memory limits",
		];

		return `## Executive Summary

### Health Score: ${report.healthScore}/100 ${healthEmoji(report.healthScore)}

### Key Findings
${findings.join("\n")}

### Quick Stats
| Metric | Value |
| --- | --- |
| Compose version | ${report.version ?? "not declared"} |
| Services | ${report.metrics.totalServices} |
| Services with build | ${report.metrics.servicesWithBuild} |
| Named volumes | ${report.metrics.namedVolumes} |
| Total issues | ${report.metrics.totalIssues} |
| Critical issues | ${report.metrics.criticalIssues} |
| High issues | ${report.metrics.highIssues} |`;
	}

	private buildMetricsSection(report: FullComposeReport): string {
		return `## Metrics

| Metric | Value |
| --- | --- |
| Total services | ${report.metrics.totalServices} |
| Services with build contexts | ${report.metrics.servicesWithBuild} |
| Named volumes | ${report.metrics.namedVolumes} |
| Total issues | ${report.metrics.totalIssues} |
| Critical issues | ${report.metrics.criticalIssues} |
| High issues | ${report.metrics.highIssues} |`;
	}

	private buildIssuesSection(report: FullComposeReport): string {
		if (report.allIssues.length === 0) {
			return "## Issues\n\nNo issues detected.";
		}

		const rows = report.allIssues
			.map((issue) => {
				const fix = issue.fix ? issue.fix.replaceAll("\n", "<br />") : "—";
				return `| ${issue.severity} | ${issue.service} | ${issue.category} | ${issue.title} | ${issue.detail} | ${fix} |`;
			})
			.join("\n");

		return `## Issues\n\n| Severity | Service | Category | Title | Detail | Fix |
| --- | --- | --- | --- | --- | --- |
${rows}`;
	}

	private buildImageSection(report: FullComposeReport): string {
		const lines = [
			`## Image Analysis`,
			``,
			`### Unpinned Images (${report.images.unpinnedImages.length})`,
		];

		if (report.images.unpinnedImages.length === 0) {
			lines.push("No unpinned images found.");
		} else {
			lines.push(`| Service | Image | Recommendation |`, `| --- | --- | --- |`);
			for (const entry of report.images.unpinnedImages) {
				lines.push(
					`| ${entry.service} | ${entry.image} | ${entry.recommendation} |`,
				);
			}
		}

		lines.push(
			"",
			`### :latest Tags (${report.images.latestTagImages.length})`,
		);
		if (report.images.latestTagImages.length === 0) {
			lines.push("No :latest tags found.");
		} else {
			lines.push(`| Service | Image |`, `| --- | --- |`);
			for (const entry of report.images.latestTagImages) {
				lines.push(`| ${entry.service} | ${entry.image} |`);
			}
		}

		return lines.join("\n");
	}

	private buildSecuritySection(report: FullComposeReport): string {
		return [
			`## Security Analysis`,
			``,
			`### Secrets in Environment (${report.security.secretsInEnv.length})`,
			report.security.secretsInEnv.length === 0
				? "No suspicious plain-text environment secrets found."
				: [
						`| Service | Variable | Pattern |`,
						`| --- | --- | --- |`,
						...report.security.secretsInEnv.map(
							(entry) =>
								`| ${entry.service} | ${entry.variable} | ${entry.pattern} |`,
						),
					].join("\n"),
			``,
			`### Privileged Services (${report.security.privilegedServices.length})`,
			report.security.privilegedServices.length === 0
				? "No privileged containers found."
				: report.security.privilegedServices
						.map((entry) => `- ${entry.service}`)
						.join("\n"),
			``,
			`### Exposed Sensitive Ports (${report.security.exposedDatabases.length})`,
			report.security.exposedDatabases.length === 0
				? "No exposed database or broker ports found."
				: [
						`| Service | Image | Port | Bind Address |`,
						`| --- | --- | --- | --- |`,
						...report.security.exposedDatabases.map(
							(entry) =>
								`| ${entry.service} | ${entry.image} | ${entry.port} | ${entry.bindAddr} |`,
						),
					].join("\n"),
		].join("\n");
	}

	private buildReliabilitySection(report: FullComposeReport): string {
		return [
			`## Reliability Analysis`,
			``,
			`### Missing Healthchecks (${report.reliability.missingHealthcheck.length})`,
			report.reliability.missingHealthcheck.length === 0
				? "All services define healthchecks."
				: report.reliability.missingHealthcheck
						.map((entry) => `- ${entry.service}`)
						.join("\n"),
			``,
			`### Unsafe depends_on (${report.reliability.unsafeDepends.length})`,
			report.reliability.unsafeDepends.length === 0
				? "No unsafe depends_on conditions found."
				: [
						`| Service | Dependency | Condition |`,
						`| --- | --- | --- |`,
						...report.reliability.unsafeDepends.map(
							(entry) =>
								`| ${entry.service} | ${entry.dependency} | ${entry.condition} |`,
						),
					].join("\n"),
			``,
			`### Missing Restart Policies (${report.reliability.missingRestart.length})`,
			report.reliability.missingRestart.length === 0
				? "All services define a restart policy."
				: report.reliability.missingRestart
						.map((entry) => `- ${entry.service}`)
						.join("\n"),
		].join("\n");
	}

	private buildResourceSection(report: FullComposeReport): string {
		return [
			`## Resource Analysis`,
			``,
			`### Services Missing Limits (${report.resources.missingLimits.length})`,
			report.resources.missingLimits.length === 0
				? "All services define CPU and memory limits."
				: [
						`| Service | Missing |`,
						`| --- | --- |`,
						...report.resources.missingLimits.map(
							(entry) => `| ${entry.service} | ${entry.missing.join(", ")} |`,
						),
					].join("\n"),
		].join("\n");
	}

	private buildNetworkSection(report: FullComposeReport): string {
		return [
			`## Network Analysis`,
			``,
			`### Services on Default Network (${report.networks.servicesOnDefaultNetwork.length})`,
			report.networks.servicesOnDefaultNetwork.length === 0
				? "No default-network usage detected."
				: report.networks.servicesOnDefaultNetwork
						.map((entry) => `- ${entry.service}`)
						.join("\n"),
			``,
			`### Random Host Bindings (${report.networks.exposedInternalPorts.length})`,
			report.networks.exposedInternalPorts.length === 0
				? "No random host bindings detected."
				: [
						`| Service | Port | Note |`,
						`| --- | --- | --- |`,
						...report.networks.exposedInternalPorts.map(
							(entry) => `| ${entry.service} | ${entry.port} | ${entry.note} |`,
						),
					].join("\n"),
		].join("\n");
	}

	private buildDockerRuntimeSection(report: FullComposeReport): string {
		if (!report.dockerRuntime) {
			return "";
		}

		if (!report.dockerRuntime.available) {
			return `## Docker Runtime\n\n${report.dockerRuntime.error ?? "Docker runtime unavailable."}`;
		}

		return [
			`## Docker Runtime`,
			``,
			`| Service | Container | State | Status | Health | Image |`,
			`| --- | --- | --- | --- | --- | --- |`,
			...report.dockerRuntime.services.map(
				(service) =>
					`| ${service.service} | ${service.containerName ?? "—"} | ${service.state ?? "—"} | ${service.status ?? "—"} | ${service.health ?? "—"} | ${service.image ?? "—"} |`,
			),
		].join("\n");
	}

	private buildRecommendationsSection(report: FullComposeReport): string {
		if (report.recommendations.length === 0) {
			return "## Recommendations\n\nNo recommendations.";
		}

		return `## Recommendations\n\n${report.recommendations
			.map((recommendation) => {
				const fix = recommendation.fix
					? `\n  - Fix: ${recommendation.fix}`
					: "";
				return `- **${recommendation.priority.toUpperCase()}** ${recommendation.service}: ${recommendation.message}${fix}`;
			})
			.join("\n")}`;
	}
}
