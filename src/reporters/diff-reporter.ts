import type { FullComposeReport } from "../types";

export interface MetricDiff {
	label: string;
	before: string | number;
	after: string | number;
	delta?: number;
	trend: "better" | "worse" | "neutral" | "unchanged";
}

export interface ReportDiff {
	currentAt: string;
	previousAt: string;
	timeDelta: string;
	metrics: MetricDiff[];
	newIssues: string[];
	resolvedIssues: string[];
}

type TrendDirection = "higher" | "lower" | "neutral";

export const DiffReporter = {
	diff(current: FullComposeReport, previous: FullComposeReport): ReportDiff {
		const currentIssues = collectIssues(current);
		const previousIssues = collectIssues(previous);

		return {
			currentAt: toIsoString(current.generatedAt),
			previousAt: toIsoString(previous.generatedAt),
			timeDelta: describeTimeDelta(previous.generatedAt, current.generatedAt),
			metrics: [
				createMetricDiff(
					"Health score",
					previous.healthScore,
					current.healthScore,
					"higher",
				),
				createMetricDiff(
					"Total issues",
					previous.metrics.totalIssues,
					current.metrics.totalIssues,
					"lower",
				),
				createMetricDiff(
					"Critical issues",
					previous.metrics.criticalIssues,
					current.metrics.criticalIssues,
					"lower",
				),
				createMetricDiff(
					"High issues",
					previous.metrics.highIssues,
					current.metrics.highIssues,
					"lower",
				),
				createMetricDiff(
					"Services",
					previous.metrics.totalServices,
					current.metrics.totalServices,
					"neutral",
				),
				createMetricDiff(
					"Build services",
					previous.metrics.servicesWithBuild,
					current.metrics.servicesWithBuild,
					"neutral",
				),
				createMetricDiff(
					"Named volumes",
					previous.metrics.namedVolumes,
					current.metrics.namedVolumes,
					"neutral",
				),
			],
			newIssues: currentIssues.filter(
				(issue) => !previousIssues.includes(issue),
			),
			resolvedIssues: previousIssues.filter(
				(issue) => !currentIssues.includes(issue),
			),
		};
	},

	print(
		diff: ReportDiff,
		write: (
			message?: unknown,
			...optionalParams: unknown[]
		) => void = console.log,
	): void {
		write(
			`\nReport diff (${diff.previousAt} → ${diff.currentAt}, ${diff.timeDelta})`,
		);

		for (const metric of diff.metrics) {
			const arrow =
				metric.trend === "better" ? "⬆️" : metric.trend === "worse" ? "⬇️" : "↔️";
			const status =
				metric.trend === "better"
					? "✓ better"
					: metric.trend === "worse"
						? "✗ worse"
						: metric.trend === "unchanged"
							? "no change"
							: "informational";
			const delta =
				metric.delta === undefined || metric.delta === 0
					? ""
					: ` (${metric.delta > 0 ? "+" : ""}${formatValue(metric.delta)})`;

			write(
				`${arrow}  ${metric.label.padEnd(16)} ${formatValue(metric.before)} → ${formatValue(metric.after)}${delta}  ${status}`,
			);
		}

		if (diff.newIssues.length > 0) {
			write(
				`⚠️  New issues (${diff.newIssues.length}): ${diff.newIssues.join(", ")}`,
			);
		}

		if (diff.resolvedIssues.length > 0) {
			write(
				`✓  Resolved (${diff.resolvedIssues.length}): ${diff.resolvedIssues.join(", ")}`,
			);
		}
	},
};

function createMetricDiff(
	label: string,
	before: number,
	after: number,
	direction: TrendDirection,
): MetricDiff {
	const delta = Math.round((after - before) * 100) / 100;

	if (delta === 0) {
		return { label, before, after, delta: 0, trend: "unchanged" };
	}

	if (direction === "neutral") {
		return { label, before, after, delta, trend: "neutral" };
	}

	const improved =
		(direction === "higher" && delta > 0) ||
		(direction === "lower" && delta < 0);
	return { label, before, after, delta, trend: improved ? "better" : "worse" };
}

function collectIssues(report: FullComposeReport): string[] {
	return report.allIssues.map(
		(issue) =>
			`${issue.service}:${issue.category}:${issue.severity}:${issue.title}`,
	);
}

function describeTimeDelta(
	previousAt: Date | string,
	currentAt: Date | string,
): string {
	const previous = new Date(previousAt);
	const current = new Date(currentAt);
	const deltaMs = Math.max(0, current.getTime() - previous.getTime());
	const deltaMinutes = Math.round(deltaMs / 60000);

	if (deltaMinutes < 60) {
		return `${deltaMinutes || 1} minute${deltaMinutes === 1 ? "" : "s"} apart`;
	}

	const deltaHours = Math.round(deltaMinutes / 60);
	if (deltaHours < 48) {
		return `${deltaHours} hour${deltaHours === 1 ? "" : "s"} apart`;
	}

	const deltaDays = Math.round(deltaHours / 24);
	return `${deltaDays} day${deltaDays === 1 ? "" : "s"} apart`;
}

function toIsoString(value: Date | string): string {
	return new Date(value).toISOString();
}

function formatValue(value: string | number): string {
	if (typeof value === "string") {
		return value;
	}

	return Number.isInteger(value) ? value.toString() : value.toFixed(2);
}
