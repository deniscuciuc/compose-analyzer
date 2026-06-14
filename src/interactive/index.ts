import { existsSync } from "node:fs";

import { confirm, input, select } from "@inquirer/prompts";
import type { ParsedOptions } from "../cli/options";
import { buildFullReport, loadPreviousReport } from "../cli/runner";
import { DiffReporter } from "../reporters/diff-reporter";
import { ReportGenerator } from "../reporters/report-generator";
import type { FullComposeReport } from "../types";
import * as display from "./display";
import {
	ANALYSIS_MENU_CHOICES,
	MAIN_MENU_CHOICES,
	REPORTS_MENU_CHOICES,
	SETTINGS_MENU_CHOICES,
} from "./menus";

export class InteractiveCLI {
	private composeFile: string;
	private outputDir: string;
	private withDocker: boolean;

	constructor(private readonly baseOptions: ParsedOptions) {
		this.composeFile = baseOptions.composeFile;
		this.outputDir = baseOptions.outputDir ?? "./reports";
		this.withDocker = baseOptions.withDocker ?? false;
	}

	async start(): Promise<void> {
		console.clear();
		console.log("\n  Compose Analyzer\n");

		let running = true;
		while (running) {
			const choice = await select({
				message: "Main menu",
				choices: MAIN_MENU_CHOICES,
			});

			switch (choice) {
				case "analysis":
					await this.analysisMenu();
					break;
				case "reports":
					await this.reportsMenu();
					break;
				case "settings":
					await this.settingsMenu();
					break;
				case "exit":
					running = false;
					break;
			}
		}

		console.log("\n  Goodbye!\n");
	}

	private async analysisMenu(): Promise<void> {
		const choice = await select({
			message: "Run analysis",
			choices: ANALYSIS_MENU_CHOICES,
		});

		if (choice === "back") {
			return;
		}

		const report = await this.safeBuildReport();
		if (!report) {
			return;
		}

		switch (choice) {
			case "full":
				display.showFullReportSummary(report);
				break;
			case "health":
				display.showHealth(report);
				break;
			case "images":
				display.showImages(report.images);
				break;
			case "security":
				display.showSecurity(report.security);
				break;
			case "reliability":
				display.showReliability(report.reliability);
				break;
			case "resources":
				display.showResources(report.resources);
				break;
			case "networks":
				display.showNetworks(report.networks);
				break;
		}
	}

	private async reportsMenu(): Promise<void> {
		const choice = await select({
			message: "Generate report",
			choices: REPORTS_MENU_CHOICES,
		});

		if (choice === "back") {
			return;
		}

		const report = await this.safeBuildReport();
		if (!report) {
			return;
		}

		const reporter = new ReportGenerator(this.outputDir, {
			outputDir: this.outputDir,
			withDocker: this.withDocker,
		});

		if (choice === "markdown" || choice === "html") {
			const markdownPath = await reporter.generateFullReport(report);
			const jsonPath = await reporter.generateJsonReport(report);
			console.log(`  ✅ Markdown: ${markdownPath}`);
			console.log(`  ✅ JSON:     ${jsonPath}`);

			if (choice === "html") {
				const htmlPath = await reporter.generateHtmlReport(report);
				console.log(`  ✅ HTML:     ${htmlPath}`);
			}
		}

		if (choice === "diff") {
			const previousPath = await input({
				message: "Path to previous JSON report:",
				validate: (value) => (existsSync(value) ? true : "File not found"),
			});
			const previous = loadPreviousReport(previousPath);
			DiffReporter.print(DiffReporter.diff(report, previous));
		}
	}

	private async settingsMenu(): Promise<void> {
		const choice = await select({
			message: "Settings",
			choices: SETTINGS_MENU_CHOICES,
		});

		switch (choice) {
			case "compose-file": {
				const nextFile = await input({
					message: "Compose file path:",
					default: this.composeFile,
					validate: (value) => (existsSync(value) ? true : "File not found"),
				});
				this.composeFile = nextFile;
				console.log(`  ✅ Compose file set to ${this.composeFile}`);
				break;
			}
			case "output": {
				const nextOutput = await input({
					message: "Reports output directory:",
					default: this.outputDir,
				});
				this.outputDir = nextOutput.trim() || this.outputDir;
				console.log(`  ✅ Output directory set to ${this.outputDir}`);
				break;
			}
			case "with-docker": {
				const toggle = await confirm({
					message: `Docker runtime checks are currently ${this.withDocker ? "enabled" : "disabled"}. Toggle?`,
					default: true,
				});
				if (toggle) {
					this.withDocker = !this.withDocker;
				}
				console.log(
					`  ✅ Docker runtime checks ${this.withDocker ? "enabled" : "disabled"}`,
				);
				break;
			}
			case "show":
				display.showCurrentSettings(
					this.composeFile,
					this.outputDir,
					this.withDocker,
				);
				break;
			case "back":
				return;
		}
	}

	private async safeBuildReport(): Promise<FullComposeReport | undefined> {
		try {
			return await buildFullReport(this.createOptions());
		} catch (error) {
			console.log(`  ❌ Error: ${error}`);
			return undefined;
		}
	}

	private createOptions(): ParsedOptions {
		return {
			...this.baseOptions,
			composeFile: this.composeFile,
			outputDir: this.outputDir,
			withDocker: this.withDocker,
			interactive: false,
			json: false,
			quiet: false,
			version: false,
			command: "full",
		};
	}
}
