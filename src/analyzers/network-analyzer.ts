import { ComposeCollector } from "../collectors/compose-collector";
import type { ComposeIssue, ComposeService, NetworkAnalysis } from "../types";

export class NetworkAnalyzer {
	analyze(
		services: Array<{ name: string; service: ComposeService }>,
		fileNetworks: Record<string, unknown> | undefined,
	): NetworkAnalysis {
		const servicesOnDefaultNetwork: NetworkAnalysis["servicesOnDefaultNetwork"] =
			[];
		const exposedInternalPorts: NetworkAnalysis["exposedInternalPorts"] = [];
		const issues: ComposeIssue[] = [];

		const hasTopLevelNetworks = Boolean(
			fileNetworks && Object.keys(fileNetworks).length > 0,
		);

		for (const { name, service } of services) {
			const hasExplicitNetwork = Array.isArray(service.networks)
				? service.networks.length > 0
				: Boolean(service.networks && Object.keys(service.networks).length > 0);

			if (!hasExplicitNetwork && hasTopLevelNetworks) {
				servicesOnDefaultNetwork.push({ service: name });
				issues.push({
					service: name,
					severity: "low",
					category: "network",
					title: "Service uses default network",
					detail: `Service "${name}" is not attached to an explicit top-level network.`,
					fix: "Assign the service to a named network so network intent is explicit.",
				});
			}

			for (const port of ComposeCollector.normalizePorts(service)) {
				if (!port.randomHostBinding) {
					continue;
				}

				exposedInternalPorts.push({
					service: name,
					port: port.raw,
					note: "Published without an explicit host port or host IP binding.",
				});
				issues.push({
					service: name,
					severity: "low",
					category: "network",
					title: "Published port uses random host binding",
					detail: `Service "${name}" publishes ${port.raw}, which lets Docker choose a host port on all interfaces.`,
					fix: "Prefer explicit mappings such as 127.0.0.1:8080:80, or remove the published port for internal-only services.",
				});
			}
		}

		return { servicesOnDefaultNetwork, exposedInternalPorts, issues };
	}
}
