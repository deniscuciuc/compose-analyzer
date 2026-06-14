import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

import type { AnalyzerConfig } from "../types";

function parseConfig(candidate: string): AnalyzerConfig {
	return JSON.parse(readFileSync(candidate, "utf-8")) as AnalyzerConfig;
}

export function loadConfig(configPath?: string): AnalyzerConfig {
	if (configPath) {
		const explicitPath = resolve(configPath);
		if (!existsSync(explicitPath)) {
			throw new Error(`Config file not found: ${explicitPath}`);
		}

		try {
			return parseConfig(explicitPath);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			throw new Error(
				`Could not parse config file at ${explicitPath}: ${message}`,
			);
		}
	}

	const candidates = [
		join(process.cwd(), ".analyzerrc.json"),
		join(homedir(), ".config", "compose-analyzer", "config.json"),
	];

	for (const candidate of candidates) {
		if (!existsSync(candidate)) {
			continue;
		}

		try {
			return parseConfig(candidate);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			console.warn(
				`Warning: could not parse config file at ${candidate}: ${message}`,
			);
		}
	}

	return {};
}
