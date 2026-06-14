import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";

import { ComposeCollector } from "../src/collectors/compose-collector";

test("ComposeCollector parses services and handles image references with registry ports", () => {
	const collector = new ComposeCollector(
		resolve(process.cwd(), "test/fixtures/compose-risky.yml"),
	);

	const services = collector.getServices();
	assert.equal(services.length, 3);
	assert.equal(
		ComposeCollector.baseImageName(
			"registry.example.com:5000/team/postgres:16.4",
		),
		"postgres",
	);
	assert.equal(
		ComposeCollector.imageTag("registry.example.com:5000/team/postgres:16.4"),
		"16.4",
	);
	assert.equal(ComposeCollector.hasDigest("nginx@sha256:abc"), true);
});

test("ComposeCollector normalizes short and long port syntax", () => {
	const collector = new ComposeCollector(
		resolve(process.cwd(), "test/fixtures/compose-risky.yml"),
	);
	const worker = collector.getServices().find(({ name }) => name === "worker");
	assert(worker);

	const normalized = ComposeCollector.normalizePorts(worker.service);
	assert.equal(normalized[0].randomHostBinding, true);
	assert.equal(normalized[0].target, "9000");
});
