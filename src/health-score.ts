import { SCORE_DEDUCTIONS } from "./constants";
import type { ComposeIssue } from "./types";

export function computeHealthScore(
	issues: ComposeIssue[],
	totalServices: number,
): number {
	if (totalServices === 0) {
		return 100;
	}

	let score = 100;
	for (const issue of issues) {
		score -= SCORE_DEDUCTIONS[issue.severity];
	}

	return Math.max(0, score);
}
