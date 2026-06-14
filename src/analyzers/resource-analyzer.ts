import type { ComposeIssue, ComposeService, ResourceAnalysis } from "../types";

export class ResourceAnalyzer {
	analyze(
		services: Array<{ name: string; service: ComposeService }>,
	): ResourceAnalysis {
		const missingLimits: ResourceAnalysis["missingLimits"] = [];
		const issues: ComposeIssue[] = [];

		for (const { name, service } of services) {
			const cpuLimit = service.deploy?.resources?.limits?.cpus ?? service.cpus;
			const memoryLimit =
				service.deploy?.resources?.limits?.memory ?? service.mem_limit;
			const missing: string[] = [];

			if (cpuLimit === undefined || cpuLimit === "") {
				missing.push("cpu");
			}

			if (!memoryLimit) {
				missing.push("memory");
			}

			if (missing.length === 0) {
				continue;
			}

			missingLimits.push({ service: name, missing });
			issues.push({
				service: name,
				severity: "medium",
				category: "resources",
				title: "Missing resource limits",
				detail: `Service "${name}" is missing ${missing.join(" and ")} limits. Unbounded containers can starve neighboring workloads.`,
				fix: "Add deploy.resources.limits for both memory and cpus, or set mem_limit and cpus in legacy Compose syntax.",
			});
		}

		return { missingLimits, issues };
	}
}
