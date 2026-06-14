import { ComposeCollector } from "../collectors/compose-collector";
import { SECRET_PATTERNS, SENSITIVE_IMAGES } from "../constants";
import type { ComposeIssue, ComposeService, SecurityAnalysis } from "../types";

export class SecurityAnalyzer {
	analyze(
		services: Array<{ name: string; service: ComposeService }>,
	): SecurityAnalysis {
		const secretsInEnv: SecurityAnalysis["secretsInEnv"] = [];
		const privilegedServices: SecurityAnalysis["privilegedServices"] = [];
		const exposedDatabases: SecurityAnalysis["exposedDatabases"] = [];
		const issues: ComposeIssue[] = [];

		for (const { name, service } of services) {
			const envVars = ComposeCollector.normalizeEnvironment(service);
			for (const [key, value] of Object.entries(envVars)) {
				const matchedPattern = SECRET_PATTERNS.find((pattern) =>
					pattern.test(key),
				);
				if (
					!matchedPattern ||
					!value.trim() ||
					this.isInterpolatedValue(value)
				) {
					continue;
				}

				secretsInEnv.push({
					service: name,
					variable: key,
					pattern: matchedPattern.source,
				});
				issues.push({
					service: name,
					severity: "high",
					category: "security",
					title: "Secret value in environment variable",
					detail: `Environment variable "${key}" appears to store a plain-text secret.`,
					fix: "Prefer Docker secrets or external secret injection instead of embedding values in Compose.",
				});
			}

			if (service.privileged) {
				privilegedServices.push({ service: name });
				issues.push({
					service: name,
					severity: "critical",
					category: "security",
					title: "Container runs in privileged mode",
					detail: `Service "${name}" sets privileged: true, which grants broad host access.`,
					fix: "Remove privileged mode and grant only the minimum required capabilities.",
				});
			}

			if (!service.image) {
				continue;
			}

			const baseImage = ComposeCollector.baseImageName(service.image);
			if (!SENSITIVE_IMAGES.has(baseImage)) {
				continue;
			}

			for (const port of ComposeCollector.normalizePorts(service)) {
				if (!port.published) {
					continue;
				}

				if (port.exposesToAllInterfaces) {
					const bindAddr = port.hostIp ?? "0.0.0.0";
					exposedDatabases.push({
						service: name,
						image: service.image,
						port: port.raw,
						bindAddr,
					});
					issues.push({
						service: name,
						severity: "high",
						category: "security",
						title: `Sensitive service port exposed on ${bindAddr}`,
						detail: `${service.image} publishes ${port.raw}, making a database or broker reachable from all interfaces.`,
						fix: `Bind the port to localhost, for example: 127.0.0.1:${port.published}:${port.target}`,
					});
				}
			}
		}

		return { secretsInEnv, privilegedServices, exposedDatabases, issues };
	}

	private isInterpolatedValue(value: string): boolean {
		return /^\$\{[^}]+\}$/.test(value) || /^\$[A-Z0-9_]+$/i.test(value);
	}
}
