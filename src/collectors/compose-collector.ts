import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import yaml from "js-yaml";

import type { ComposeFile, ComposeService, NormalizedPort } from "../types";

export class ComposeCollector {
	private readonly parsed: ComposeFile;
	private readonly filePath: string;

	constructor(filePath: string) {
		const resolved = resolve(filePath);
		if (!existsSync(resolved)) {
			throw new Error(`Compose file not found: ${resolved}`);
		}

		this.filePath = resolved;

		try {
			const loaded = yaml.load(readFileSync(resolved, "utf-8")) as
				| ComposeFile
				| undefined;
			if (!loaded || typeof loaded !== "object") {
				throw new Error("Compose file is empty or invalid.");
			}
			if (!loaded.services || typeof loaded.services !== "object") {
				throw new Error('No "services" key found in compose file.');
			}
			this.parsed = loaded;
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			throw new Error(`Error parsing ${resolved}: ${message}`);
		}
	}

	getFile(): ComposeFile {
		return this.parsed;
	}

	getFilePath(): string {
		return this.filePath;
	}

	getServices(): Array<{ name: string; service: ComposeService }> {
		return Object.entries(this.parsed.services).map(([name, service]) => ({
			name,
			service: {
				...(service ?? {}),
				name,
			},
		}));
	}

	static baseImageName(image: string): string {
		const reference = image.split("@")[0] ?? image;
		const lastSlash = reference.lastIndexOf("/");
		const lastColon = reference.lastIndexOf(":");
		const withoutTag =
			lastColon > lastSlash ? reference.slice(0, lastColon) : reference;
		const parts = withoutTag.split("/");
		return (parts[parts.length - 1] ?? withoutTag).toLowerCase();
	}

	static imageTag(image: string): string {
		if (ComposeCollector.hasDigest(image)) {
			return "";
		}

		const reference = image.split("@")[0] ?? image;
		const lastSlash = reference.lastIndexOf("/");
		const lastColon = reference.lastIndexOf(":");
		return lastColon > lastSlash ? reference.slice(lastColon + 1) : "";
	}

	static hasDigest(image: string): boolean {
		return image.includes("@sha256:");
	}

	static normalizeEnvironment(service: ComposeService): Record<string, string> {
		const result: Record<string, string> = {};
		if (!service.environment) {
			return result;
		}

		if (Array.isArray(service.environment)) {
			for (const entry of service.environment) {
				const [key, ...rest] = entry.split("=");
				result[key] = rest.join("=");
			}
			return result;
		}

		for (const [key, value] of Object.entries(service.environment)) {
			result[key] = value ?? "";
		}

		return result;
	}

	static normalizePorts(service: ComposeService): NormalizedPort[] {
		const ports = service.ports ?? [];
		return ports.map((port) => {
			if (typeof port === "string") {
				return ComposeCollector.parsePortString(port);
			}

			return {
				raw: `${port.host_ip ? `${port.host_ip}:` : ""}${port.published ? `${port.published}:` : ""}${port.target}${port.protocol ? `/${port.protocol}` : ""}`,
				hostIp: port.host_ip,
				published: port.published?.toString(),
				target: port.target.toString(),
				protocol: port.protocol ?? "tcp",
				exposesToAllInterfaces:
					port.published !== undefined &&
					(!port.host_ip || port.host_ip === "0.0.0.0"),
				randomHostBinding: port.published === undefined,
			};
		});
	}

	private static parsePortString(value: string): NormalizedPort {
		const [body, protocol = "tcp"] = value.split("/");
		const parts = body.split(":");

		if (parts.length === 1) {
			return {
				raw: value,
				target: parts[0],
				protocol,
				exposesToAllInterfaces: true,
				randomHostBinding: true,
			};
		}

		if (parts.length === 2) {
			return {
				raw: value,
				published: parts[0],
				target: parts[1],
				protocol,
				exposesToAllInterfaces: true,
				randomHostBinding: false,
			};
		}

		const hostIp = parts.slice(0, -2).join(":");
		const published = parts.at(-2) ?? "";
		const target = parts.at(-1) ?? "";

		return {
			raw: value,
			hostIp,
			published,
			target,
			protocol,
			exposesToAllInterfaces: hostIp === "" || hostIp === "0.0.0.0",
			randomHostBinding: false,
		};
	}
}
