export const SENSITIVE_IMAGES = new Set([
	"postgres",
	"postgresql",
	"mysql",
	"mariadb",
	"mongo",
	"mongodb",
	"redis",
	"elasticsearch",
	"opensearch",
	"cassandra",
	"rabbitmq",
	"kafka",
	"zookeeper",
	"clickhouse",
	"mssql",
	"mssql-server",
]);

export const SECRET_PATTERNS: RegExp[] = [
	/PASSWORD/i,
	/PASSWD/i,
	/SECRET/i,
	/API_KEY/i,
	/APIKEY/i,
	/TOKEN/i,
	/PRIVATE_KEY/i,
	/PRIVATE_TOKEN/i,
	/AUTH/i,
	/CREDENTIALS/i,
	/WEBHOOK/i,
	/ACCESS_KEY/i,
	/ACCESS_SECRET/i,
];

export const WEAK_RESTART_POLICIES = new Set(["no", "none", ""]);

export const SCORE_DEDUCTIONS = {
	critical: 15,
	high: 8,
	medium: 4,
	low: 1,
} as const;

export const COMMANDS = [
	"full",
	"health",
	"images",
	"security",
	"reliability",
	"resources",
	"networks",
] as const;

export const FULL_ANALYSIS_COMMANDS = [
	"health",
	"images",
	"security",
	"reliability",
	"resources",
	"networks",
] as const;

export type Command = (typeof COMMANDS)[number];

export const DEFAULTS = {
	composeFile: "docker-compose.yml",
	output: "./reports",
} as const;

export const SEVERITY_ORDER = {
	critical: 0,
	high: 1,
	medium: 2,
	low: 3,
} as const;
