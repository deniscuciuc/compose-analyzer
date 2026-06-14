import type {
	FullComposeReport,
	ImageAnalysis,
	NetworkAnalysis,
	ReliabilityAnalysis,
	ResourceAnalysis,
	SecurityAnalysis,
} from "../types";
import {
	printBullet,
	printRow,
	printSection,
	printSubBullet,
} from "../utils/print";

export function showHealth(report: FullComposeReport): void {
	printSection("Health");
	printRow("Health score", `${report.healthScore}/100`);
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

	printBullet("Top issues:");
	for (const issue of report.allIssues.slice(0, 5)) {
		printSubBullet(`[${issue.severity}] ${issue.service} — ${issue.title}`);
	}
}

export function showFullReportSummary(report: FullComposeReport): void {
	showHealth(report);
	if (report.recommendations.length > 0) {
		printSection("Recommendations");
		for (const recommendation of report.recommendations.slice(0, 10)) {
			printBullet(
				`${recommendation.priority.toUpperCase()} ${recommendation.service}: ${recommendation.message}`,
			);
		}
	}

	if (report.dockerRuntime) {
		showDockerRuntime(report);
	}
}

export function showImages(analysis: ImageAnalysis): void {
	printSection("Images");
	if (
		analysis.unpinnedImages.length === 0 &&
		analysis.latestTagImages.length === 0
	) {
		printBullet("No image pinning issues found.");
		return;
	}

	for (const entry of analysis.unpinnedImages) {
		printBullet(`Unpinned: ${entry.service} → ${entry.image}`);
		printSubBullet(entry.recommendation);
	}

	for (const entry of analysis.latestTagImages) {
		printBullet(`Latest tag: ${entry.service} → ${entry.image}`);
	}
}

export function showSecurity(analysis: SecurityAnalysis): void {
	printSection("Security");
	if (analysis.issues.length === 0) {
		printBullet("No security issues found.");
		return;
	}

	for (const issue of analysis.issues) {
		printBullet(`[${issue.severity}] ${issue.service} — ${issue.title}`);
		printSubBullet(issue.detail);
	}
}

export function showReliability(analysis: ReliabilityAnalysis): void {
	printSection("Reliability");
	if (analysis.issues.length === 0) {
		printBullet("No reliability issues found.");
		return;
	}

	for (const issue of analysis.issues) {
		printBullet(`[${issue.severity}] ${issue.service} — ${issue.title}`);
		printSubBullet(issue.detail);
	}
}

export function showResources(analysis: ResourceAnalysis): void {
	printSection("Resources");
	if (analysis.issues.length === 0) {
		printBullet("All services define CPU and memory limits.");
		return;
	}

	for (const missing of analysis.missingLimits) {
		printBullet(
			`${missing.service} missing ${missing.missing.join(" and ")} limits`,
		);
	}
}

export function showNetworks(analysis: NetworkAnalysis): void {
	printSection("Networks");
	if (analysis.issues.length === 0) {
		printBullet("No network issues found.");
		return;
	}

	for (const issue of analysis.issues) {
		printBullet(`[${issue.severity}] ${issue.service} — ${issue.title}`);
		printSubBullet(issue.detail);
	}
}

export function showCurrentSettings(
	composeFile: string,
	outputDir: string,
	withDocker: boolean,
): void {
	printSection("Current Settings");
	printRow("Compose file", composeFile);
	printRow("Output dir", outputDir);
	printRow("Docker runtime", withDocker ? "enabled" : "disabled");
}

export function showDockerRuntime(report: FullComposeReport): void {
	if (!report.dockerRuntime) {
		return;
	}

	printSection("Docker Runtime");
	if (!report.dockerRuntime.available) {
		printBullet(report.dockerRuntime.error ?? "Runtime unavailable.");
		return;
	}

	for (const service of report.dockerRuntime.services) {
		printBullet(`${service.service} → ${service.state ?? "unknown"}`);
		printSubBullet(
			`${service.containerName ?? "no container"} | ${service.status ?? "no status"}`,
		);
	}
}
