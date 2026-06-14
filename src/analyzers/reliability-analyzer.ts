import { WEAK_RESTART_POLICIES } from "../constants";
import type {
	ComposeIssue,
	ComposeService,
	ReliabilityAnalysis,
} from "../types";

export class ReliabilityAnalyzer {
	analyze(
		services: Array<{ name: string; service: ComposeService }>,
	): ReliabilityAnalysis {
		const missingHealthcheck: ReliabilityAnalysis["missingHealthcheck"] = [];
		const unsafeDepends: ReliabilityAnalysis["unsafeDepends"] = [];
		const missingRestart: ReliabilityAnalysis["missingRestart"] = [];
		const insecureRestartPolicy: ReliabilityAnalysis["insecureRestartPolicy"] =
			[];
		const issues: ComposeIssue[] = [];

		const servicesWithHealthcheck = new Set(
			services
				.filter(
					({ service }) => service.healthcheck && !service.healthcheck.disable,
				)
				.map(({ name }) => name),
		);

		for (const { name, service } of services) {
			if (!service.healthcheck || service.healthcheck.disable) {
				missingHealthcheck.push({ service: name });
				issues.push({
					service: name,
					severity: "medium",
					category: "reliability",
					title: "No healthcheck defined",
					detail: `Service "${name}" does not define a usable healthcheck.`,
					fix: "Add healthcheck.test, interval, timeout, and retries so readiness can be verified.",
				});
			}

			if (service.depends_on) {
				const dependencies = Array.isArray(service.depends_on)
					? service.depends_on.map((dependency) => ({
							dependency,
							condition: "service_started",
						}))
					: Object.entries(service.depends_on).map(([dependency, details]) => ({
							dependency,
							condition: details.condition ?? "service_started",
						}));

				for (const { dependency, condition } of dependencies) {
					if (
						condition !== "service_healthy" &&
						servicesWithHealthcheck.has(dependency)
					) {
						unsafeDepends.push({ service: name, dependency, condition });
						issues.push({
							service: name,
							severity: "high",
							category: "reliability",
							title: `depends_on "${dependency}" uses ${condition}`,
							detail: `Service "${name}" may start before "${dependency}" is actually ready.`,
							fix: `Use depends_on.${dependency}.condition: service_healthy.`,
						});
					}
				}
			}

			if (!service.restart) {
				missingRestart.push({ service: name });
				issues.push({
					service: name,
					severity: "low",
					category: "reliability",
					title: "No restart policy",
					detail: `Service "${name}" has no restart policy and will not recover automatically after a crash.`,
					fix: "Set restart: unless-stopped or restart: on-failure.",
				});
			} else if (WEAK_RESTART_POLICIES.has(service.restart)) {
				insecureRestartPolicy.push({ service: name, policy: service.restart });
				issues.push({
					service: name,
					severity: "low",
					category: "reliability",
					title: `Weak restart policy: ${service.restart}`,
					detail: `Service "${name}" uses restart: ${service.restart}, which provides poor crash recovery.`,
					fix: "Use restart: unless-stopped or restart: on-failure.",
				});
			}
		}

		return {
			missingHealthcheck,
			unsafeDepends,
			missingRestart,
			insecureRestartPolicy,
			issues,
		};
	}
}
