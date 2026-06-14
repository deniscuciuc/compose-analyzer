import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import type { ParsedOptions } from "../src/cli/options";
import { buildFullReport, loadPreviousReport } from "../src/cli/runner";
import { DiffReporter } from "../src/reporters/diff-reporter";
import { ReportGenerator } from "../src/reporters/report-generator";

const repoRoot = process.cwd();
const outputDir = resolve(repoRoot, "test-output");

function createOptions(composeFile: string): ParsedOptions {
	return {
		composeFile,
		command: "full",
		interactive: false,
		json: false,
		quiet: true,
		version: false,
		withDocker: false,
		html: false,
		outputDir,
	};
}

test("report generator writes markdown, json, and html outputs", async () => {
	mkdirSync(outputDir, { recursive: true });
	const report = await buildFullReport(
		createOptions(resolve(repoRoot, "test/fixtures/compose-risky.yml")),
	);
	const reporter = new ReportGenerator(outputDir, { outputDir });

	const markdown = await reporter.generateFullReport(report, "fixed");
	const json = await reporter.generateJsonReport(report, "fixed");
	const html = await reporter.generateHtmlReport(report, "fixed");

	assert.equal(existsSync(markdown), true);
	assert.equal(existsSync(json), true);
	assert.equal(existsSync(html), true);

	const previous = loadPreviousReport(json);
	const diff = DiffReporter.diff(report, previous);
	assert.equal(diff.newIssues.length, 0);
	assert.equal(diff.resolvedIssues.length, 0);

	rmSync(outputDir, { recursive: true, force: true });
});

test("CLI health command emits JSON", () => {
	const stdout = execFileSync(
		process.execPath,
		[
			"-r",
			"ts-node/register",
			"index.ts",
			"-j",
			"-c",
			"health",
			"-f",
			"test/fixtures/compose-risky.yml",
		],
		{
			cwd: repoRoot,
			encoding: "utf8",
		},
	);

	const parsed = JSON.parse(stdout) as {
		healthScore: number;
		metrics: { totalServices: number };
		issues: string[];
	};
	assert.equal(parsed.metrics.totalServices, 3);
	assert(parsed.healthScore < 100);
	assert(parsed.issues.length > 0);
});
