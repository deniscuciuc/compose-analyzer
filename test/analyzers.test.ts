import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";
import type { ParsedOptions } from "../src/cli/options";
import { buildFullReport } from "../src/cli/runner";

function createOptions(composeFile: string): ParsedOptions {
	return {
		composeFile,
		command: "full",
		interactive: false,
		json: false,
		quiet: true,
		version: false,
		help: false,
		withDocker: false,
		html: false,
		outputDir: "./reports",
	};
}

test("risky fixture produces sorted issues across all analyzers", async () => {
	const report = await buildFullReport(
		createOptions(resolve(process.cwd(), "test/fixtures/compose-risky.yml")),
	);

	assert.equal(report.metrics.totalServices, 3);
	assert.equal(report.metrics.namedVolumes, 1);
	assert.equal(report.allIssues[0]?.severity, "critical");
	assert.equal(report.security.privilegedServices.length, 1);
	assert.equal(report.images.latestTagImages.length, 1);
	assert.equal(report.resources.missingLimits.length, 3);
	assert.equal(report.reliability.unsafeDepends.length, 2);
	assert.equal(report.networks.servicesOnDefaultNetwork.length, 2);
	assert(report.healthScore < 100);
});

test("healthy fixture stays free of high and critical issues", async () => {
	const report = await buildFullReport(
		createOptions(resolve(process.cwd(), "test/fixtures/compose-healthy.yml")),
	);

	assert.equal(report.metrics.totalIssues, 0);
	assert.equal(report.healthScore, 100);
	assert.equal(report.security.issues.length, 0);
	assert.equal(report.resources.issues.length, 0);
});
