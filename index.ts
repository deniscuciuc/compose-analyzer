import packageJson from "./package.json";
import { parseOptions } from "./src/cli/options";
import { executeCommand } from "./src/cli/runner";
import { loadConfig } from "./src/config/loader";
import { DEFAULTS } from "./src/constants";
import { InteractiveCLI } from "./src/interactive";

async function main(): Promise<void> {
	const options = parseOptions();

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
	process.exit(1);
});
