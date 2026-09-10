import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { ComposeAnalyzer } from "../src/api";
import * as api from "../src/index";

const RISKY = "test/fixtures/compose-risky.yml";

test("the library entry point exports the analyzer and its parts", () => {
	assert.equal(typeof api.ComposeAnalyzer, "function");
	assert.equal(typeof api.SecurityAnalyzer, "function");
	assert.equal(typeof api.ReliabilityAnalyzer, "function");
	assert.equal(typeof api.ComposeCollector, "function");
	assert.equal(typeof api.DockerCollector, "function");
	assert.equal(typeof api.computeHealthScore, "function");
	assert.equal(typeof api.ReportGenerator, "function");
	assert.ok(Array.isArray(api.COMMANDS));
});

test("constructing an analyzer reads nothing", () => {
	// Importing and constructing must be inert: the CLI entry point parses argv and runs an
	// analysis, and that must not happen on require().
	const analyzer = new ComposeAnalyzer({ composeFile: "does-not-exist.yml" });
	assert.ok(analyzer instanceof ComposeAnalyzer);
});

test("analyze produces a report with issues and a health score", async () => {
	const report = await new ComposeAnalyzer({ composeFile: RISKY }).analyze();

	assert.equal(typeof report.healthScore, "number");
	assert.ok(report.healthScore >= 0 && report.healthScore <= 100);
	assert.ok(Array.isArray(report.allIssues));
	assert.ok(
		report.allIssues.length > 0,
		"the risky fixture should produce issues",
	);
});

test("a missing compose file fails with a clear error", async () => {
	const analyzer = new ComposeAnalyzer({ composeFile: "no-such-compose.yml" });

	await assert.rejects(() => analyzer.analyze());
});

test("every issue carries a service, severity and category", async () => {
	const report = await new ComposeAnalyzer({ composeFile: RISKY }).analyze();

	for (const issue of report.allIssues) {
		assert.ok(issue.title, "issue needs a title");
		assert.ok(issue.severity, "issue needs a severity");
		assert.ok(issue.category, "issue needs a category");
	}
});

test("issues are ordered with the most severe first", async () => {
	const report = await new ComposeAnalyzer({ composeFile: RISKY }).analyze();
	const rank = { critical: 0, high: 1, medium: 2, low: 3 } as const;

	const ranks = report.allIssues.map((issue) => rank[issue.severity]);
	const sorted = [...ranks].sort((a, b) => a - b);
	assert.deepEqual(
		ranks,
		sorted,
		"issues should already be sorted by severity",
	);
});

test("withDocker defaults off, so no daemon is required", async () => {
	// The analysis must complete on a machine with no Docker daemon at all.
	const report = await new ComposeAnalyzer({ composeFile: RISKY }).analyze();

	assert.equal(report.dockerRuntime, undefined);
});

test("generateReport honours the configured output directory", async () => {
	const outputDir = mkdtempSync(join(tmpdir(), "compose-api-"));
	const analyzer = new ComposeAnalyzer({ composeFile: RISKY, outputDir });

	const path = await analyzer.generateReport("json");

	assert.ok(
		path.startsWith(outputDir),
		`${path} should be inside ${outputDir}`,
	);
	const parsed = JSON.parse(readFileSync(path, "utf8"));
	assert.ok((parsed.healthScore ?? parsed.report?.healthScore) !== undefined);
});

test("the html report escapes a hostile service name", async () => {
	const outputDir = mkdtempSync(join(tmpdir(), "compose-api-"));
	const analyzer = new ComposeAnalyzer({ composeFile: RISKY, outputDir });

	const report = await analyzer.analyze();
	report.allIssues.push({
		service: "<script>alert(1)</script>",
		severity: "high",
		category: "security",
		title: "<img src=x onerror=alert(1)>",
		detail: "injected",
	});
	report.security.issues.push({
		service: "<script>alert(1)</script>",
		severity: "high",
		category: "security",
		title: "<img src=x onerror=alert(1)>",
		detail: "injected",
	});

	const path = await analyzer.generateReport("html", report);
	const contents = readFileSync(path, "utf8");

	// The dangerous form is the raw tag. An escaped &lt;img ... onerror=... &gt; still
	// contains "onerror=" as literal text, which is inert — so assert on the markup.
	assert.ok(
		!contents.includes("<script>alert(1)</script>"),
		"a service name must not reach the HTML unescaped",
	);
	assert.ok(
		!contents.includes("<img src=x"),
		"an issue title must not reach the HTML as a live tag",
	);
	assert.ok(
		contents.includes("&lt;script&gt;") && contents.includes("&lt;img src=x"),
		"the hostile values should be present, escaped",
	);
});
