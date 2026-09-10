import packageJson from "../../package.json";
import { loadConfig } from "../config/loader";
import { DEFAULTS } from "../constants";
import { InteractiveCLI } from "../interactive";
import { parseOptions } from "./options";
import { executeCommand } from "./runner";

async function main(): Promise<void> {
	const options = parseOptions();

	if (options.help) {
		return;
	}

	if (options.version) {
		console.log(packageJson.version);
		return;
	}

	const config = loadConfig(options.config);
	const runtimeOptions = {
		...options,
		outputDir: options.outputDir ?? config.output ?? DEFAULTS.output,
	};

	if (runtimeOptions.interactive) {
		const cli = new InteractiveCLI(runtimeOptions);
		await cli.start();
		return;
	}

	await executeCommand(runtimeOptions);
}

main().catch((error) => {
	const message = error instanceof Error ? error.message : String(error);
	console.error("Error during analysis:", message);
	// Set exitCode rather than calling process.exit, which can truncate buffered stdout —
	// e.g. a large --json report being piped to a file.
	process.exitCode = 1;
});
