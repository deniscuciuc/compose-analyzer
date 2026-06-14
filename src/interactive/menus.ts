export const MAIN_MENU_CHOICES = [
	{ name: "🔍  Run analysis", value: "analysis" },
	{ name: "📊  Generate reports", value: "reports" },
	{ name: "⚙️  Settings", value: "settings" },
	{ name: "❌  Exit", value: "exit" },
] as const;

export const ANALYSIS_MENU_CHOICES = [
	{ name: "📊  Full analysis", value: "full" },
	{ name: "⚡  Health", value: "health" },
	{ name: "🖼️  Images", value: "images" },
	{ name: "🔐  Security", value: "security" },
	{ name: "🛟  Reliability", value: "reliability" },
	{ name: "📦  Resources", value: "resources" },
	{ name: "🌐  Networks", value: "networks" },
	{ name: "← Back", value: "back" },
] as const;

export const REPORTS_MENU_CHOICES = [
	{ name: "📝  Markdown + JSON report", value: "markdown" },
	{ name: "🌐  Markdown + JSON + HTML report", value: "html" },
	{ name: "🔀  Diff with previous report", value: "diff" },
	{ name: "← Back", value: "back" },
] as const;

export const SETTINGS_MENU_CHOICES = [
	{ name: "📄  Set compose file", value: "compose-file" },
	{ name: "📁  Set output directory", value: "output" },
	{ name: "🐳  Toggle Docker runtime checks", value: "with-docker" },
	{ name: "📋  Show current settings", value: "show" },
	{ name: "← Back", value: "back" },
] as const;
