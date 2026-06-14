import type {
	ComposeService,
	DockerRuntimeService,
	DockerRuntimeSummary,
} from "../types";

export class DockerCollector {
	async collect(
		services: Array<{ name: string; service: ComposeService }>,
	): Promise<DockerRuntimeSummary> {
		try {
			const DockerModule = await import("dockerode");
			const Docker = DockerModule.default;
			const docker = new Docker();
			const containers = await docker.listContainers({ all: true });
			const runtimeServices: DockerRuntimeService[] = [];

			for (const { name } of services) {
				const container = containers.find((entry) => {
					const composeService = entry.Labels?.["com.docker.compose.service"];
					if (composeService === name) {
						return true;
					}

					return (entry.Names ?? []).some((containerName) => {
						const normalized = containerName.replace(/^\//, "");
						return normalized === name || normalized.includes(`_${name}_`);
					});
				});

				if (!container) {
					runtimeServices.push({
						service: name,
						state: "not-found",
						status: "No matching container found",
					});
					continue;
				}

				let health: string | undefined;
				try {
					const inspect = await docker.getContainer(container.Id).inspect();
					health = inspect.State?.Health?.Status;
				} catch {
					health = undefined;
				}

				runtimeServices.push({
					service: name,
					containerName: container.Names?.[0]?.replace(/^\//, ""),
					image: container.Image,
					state: container.State,
					status: container.Status,
					health,
				});
			}

			return {
				available: true,
				services: runtimeServices,
			};
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			return {
				available: false,
				error: `Docker runtime information unavailable: ${message}`,
				services: [],
			};
		}
	}
}
