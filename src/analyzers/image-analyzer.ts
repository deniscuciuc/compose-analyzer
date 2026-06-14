import { ComposeCollector } from "../collectors/compose-collector";
import type { ComposeIssue, ComposeService, ImageAnalysis } from "../types";

export class ImageAnalyzer {
	analyze(
		services: Array<{ name: string; service: ComposeService }>,
	): ImageAnalysis {
		const unpinnedImages: ImageAnalysis["unpinnedImages"] = [];
		const latestTagImages: ImageAnalysis["latestTagImages"] = [];
		const issues: ComposeIssue[] = [];

		for (const { name, service } of services) {
			if (!service.image) {
				if (service.build) {
					continue;
				}

				issues.push({
					service: name,
					severity: "high",
					category: "image",
					title: "No image or build context",
					detail: `Service "${name}" has neither an image nor a build context.`,
					fix: "Add an image reference or a build.context definition.",
				});
				continue;
			}

			if (ComposeCollector.hasDigest(service.image)) {
				continue;
			}

			const tag = ComposeCollector.imageTag(service.image);
			const base = ComposeCollector.baseImageName(service.image);

			if (!tag) {
				unpinnedImages.push({
					service: name,
					image: service.image,
					recommendation: `Pin ${service.image} to a stable version such as ${base}:<version>.`,
				});
				issues.push({
					service: name,
					severity: "medium",
					category: "image",
					title: "Image not version-pinned",
					detail: `${service.image} has no explicit tag or digest, which hurts reproducibility.`,
					fix: `Change to image: ${service.image}:<version> or pin by digest.`,
				});
				continue;
			}

			if (tag === "latest") {
				latestTagImages.push({ service: name, image: service.image });
				issues.push({
					service: name,
					severity: "medium",
					category: "image",
					title: "Image uses :latest tag",
					detail: `${service.image} can change between deploys without notice.`,
					fix: `Pin to a specific version tag such as ${base}:<version>.`,
				});
			}
		}

		return { unpinnedImages, latestTagImages, issues };
	}
}
