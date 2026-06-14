export interface ComposeService {
	name?: string;
	image?: string;
	build?: string | { context?: string; dockerfile?: string };
	ports?: Array<
		| string
		| {
				target: number;
				published?: number | string;
				host_ip?: string;
				protocol?: string;
		  }
	>;
	environment?: Record<string, string | null> | string[];
	env_file?: string | string[];
	volumes?: Array<
		| string
		| {
				type?: string;
				source?: string;
				target?: string;
		  }
	>;
	networks?: string[] | Record<string, unknown>;
	depends_on?: string[] | Record<string, { condition?: string }>;
	healthcheck?: {
		test: string | string[];
		interval?: string;
		timeout?: string;
		retries?: number;
		start_period?: string;
		disable?: boolean;
	};
	restart?: string;
	deploy?: {
		resources?: {
			limits?: { cpus?: string; memory?: string };
			reservations?: { cpus?: string; memory?: string };
		};
	};
	mem_limit?: string;
	mem_reservation?: string;
	cpus?: number | string;
	user?: string;
	privileged?: boolean;
	cap_add?: string[];
	cap_drop?: string[];
	secrets?: string[];
	labels?: Record<string, string> | string[];
}

export interface ComposeFile {
	version?: string;
	services: Record<string, ComposeService>;
	networks?: Record<string, unknown>;
	volumes?: Record<string, unknown>;
	secrets?: Record<string, unknown>;
}

export type ComposeSeverity = "critical" | "high" | "medium" | "low";
export type ComposeCategory =
	| "image"
	| "security"
	| "reliability"
	| "resources"
	| "network";

export interface ComposeIssue {
	service: string;
	severity: ComposeSeverity;
	category: ComposeCategory;
	title: string;
	detail: string;
	fix?: string;
}

export interface ImageAnalysis {
	unpinnedImages: {
		service: string;
		image: string;
		recommendation: string;
	}[];
	latestTagImages: { service: string; image: string }[];
	issues: ComposeIssue[];
}

export interface SecurityAnalysis {
	secretsInEnv: { service: string; variable: string; pattern: string }[];
	privilegedServices: { service: string }[];
	exposedDatabases: {
		service: string;
		image: string;
		port: string;
		bindAddr: string;
	}[];
	issues: ComposeIssue[];
}

export interface ReliabilityAnalysis {
	missingHealthcheck: { service: string }[];
	unsafeDepends: {
		service: string;
		dependency: string;
		condition: string;
	}[];
	missingRestart: { service: string }[];
	insecureRestartPolicy: { service: string; policy: string }[];
	issues: ComposeIssue[];
}

export interface ResourceAnalysis {
	missingLimits: { service: string; missing: string[] }[];
	issues: ComposeIssue[];
}

export interface NetworkAnalysis {
	servicesOnDefaultNetwork: { service: string }[];
	exposedInternalPorts: { service: string; port: string; note: string }[];
	issues: ComposeIssue[];
}

export interface ComposeMetrics {
	totalServices: number;
	servicesWithBuild: number;
	namedVolumes: number;
	totalIssues: number;
	criticalIssues: number;
	highIssues: number;
}

export interface Recommendation {
	priority: ComposeSeverity;
	service: string;
	message: string;
	fix?: string;
}

export interface DockerRuntimeService {
	service: string;
	containerName?: string;
	image?: string;
	state?: string;
	status?: string;
	health?: string;
}

export interface DockerRuntimeSummary {
	available: boolean;
	error?: string;
	services: DockerRuntimeService[];
}

export interface FullComposeReport {
	generatedAt: Date;
	composeFile: string;
	version?: string;
	healthScore: number;
	metrics: ComposeMetrics;
	images: ImageAnalysis;
	security: SecurityAnalysis;
	reliability: ReliabilityAnalysis;
	resources: ResourceAnalysis;
	networks: NetworkAnalysis;
	allIssues: ComposeIssue[];
	recommendations: Recommendation[];
	dockerRuntime?: DockerRuntimeSummary;
}

export interface NormalizedPort {
	raw: string;
	hostIp?: string;
	published?: string;
	target: string;
	protocol: string;
	exposesToAllInterfaces: boolean;
	randomHostBinding: boolean;
}

export interface AnalyzerOptions {
	outputDir?: string;
	withDocker?: boolean;
	quiet?: boolean;
	html?: boolean;
}

export interface AnalyzerConfig {
	output?: string;
}
