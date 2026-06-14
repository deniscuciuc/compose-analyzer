import type { FullComposeReport } from "../types";

// biome-ignore lint/complexity/noStaticOnlyClass: grouped HTML helpers keep the template readable.
export class HtmlReporter {
	static generate(report: FullComposeReport): string {
		return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Compose Analysis Report</title>
    <style>
      :root {
        --bg: #f8fafc;
        --surface: #ffffff;
        --text: #0f172a;
        --muted: #475569;
        --border: #cbd5e1;
      }
      @media (prefers-color-scheme: dark) {
        :root {
          --bg: #020617;
          --surface: #0f172a;
          --text: #e2e8f0;
          --muted: #94a3b8;
          --border: #334155;
        }
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: var(--bg);
        color: var(--text);
        line-height: 1.5;
      }
      header, main {
        width: min(1200px, calc(100% - 2rem));
        margin: 0 auto;
      }
      header {
        padding: 2rem 0 1rem;
      }
      nav {
        position: sticky;
        top: 0;
        z-index: 10;
        background: color-mix(in srgb, var(--bg) 92%, transparent);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid var(--border);
      }
      nav ul {
        width: min(1200px, calc(100% - 2rem));
        margin: 0 auto;
        padding: 0.75rem 0;
        list-style: none;
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
      }
      nav a {
        text-decoration: none;
        color: var(--muted);
      }
      nav a:hover { color: var(--text); }
      .badge {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 0.25rem 0.75rem;
        font-weight: 700;
        font-size: 0.9rem;
      }
      .badge-critical { background: #fee2e2; color: #991b1b; }
      .badge-high { background: #ffedd5; color: #9a3412; }
      .badge-medium { background: #fef9c3; color: #854d0e; }
      .badge-low { background: #dcfce7; color: #166534; }
      .badge-score-ok { background: #dcfce7; color: #166534; }
      .badge-score-warn { background: #fef9c3; color: #854d0e; }
      .badge-score-high { background: #ffedd5; color: #9a3412; }
      .badge-score-critical { background: #fee2e2; color: #991b1b; }
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 1rem;
        margin: 1.5rem 0;
      }
      .card, section {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 1rem;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
      }
      .card { padding: 1rem; }
      .card p, .meta { color: var(--muted); }
      section { margin-bottom: 1rem; overflow: hidden; }
      .section-body { padding: 1.25rem; }
      .table-wrap { overflow-x: auto; }
      table {
        width: 100%;
        border-collapse: collapse;
        min-width: 600px;
      }
      th, td {
        text-align: left;
        padding: 0.75rem;
        border-bottom: 1px solid var(--border);
        vertical-align: top;
      }
      tbody tr:nth-child(even) {
        background: color-mix(in srgb, var(--surface) 92%, var(--border));
      }
      ul { margin: 0; padding-left: 1.25rem; }
      code { white-space: pre-wrap; }
    </style>
  </head>
  <body>
    <header>
      <div class="meta">
        <strong>${HtmlReporter.escapeHtml(report.composeFile)}</strong>
        <span>Generated ${HtmlReporter.escapeHtml(new Date(report.generatedAt).toISOString())}</span>
      </div>
      <h1>Compose Analysis Report</h1>
      <span class="badge ${HtmlReporter.getHealthBadgeClass(report.healthScore)}">Health score: ${report.healthScore}/100</span>
      <div class="summary-grid">
        ${HtmlReporter.summaryCard("Services", String(report.metrics.totalServices))}
        ${HtmlReporter.summaryCard("Issues", String(report.metrics.totalIssues))}
        ${HtmlReporter.summaryCard("Critical", String(report.metrics.criticalIssues))}
        ${HtmlReporter.summaryCard("High", String(report.metrics.highIssues))}
        ${HtmlReporter.summaryCard("Build services", String(report.metrics.servicesWithBuild))}
        ${HtmlReporter.summaryCard("Named volumes", String(report.metrics.namedVolumes))}
      </div>
    </header>
    <nav>
      <ul>
        <li><a href="#summary">Summary</a></li>
        <li><a href="#issues">Issues</a></li>
        <li><a href="#recommendations">Recommendations</a></li>
        ${report.dockerRuntime ? '<li><a href="#runtime">Runtime</a></li>' : ""}
      </ul>
    </nav>
    <main>
      ${HtmlReporter.section(
				"summary",
				"Summary",
				HtmlReporter.tableBlock(
					["Metric", "Value"],
					[
						["Compose version", report.version ?? "not declared"],
						["Health score", `${report.healthScore}/100`],
						["Total services", String(report.metrics.totalServices)],
						["Total issues", String(report.metrics.totalIssues)],
						["Critical issues", String(report.metrics.criticalIssues)],
						["High issues", String(report.metrics.highIssues)],
					],
					"No summary data available.",
				),
			)}
      ${HtmlReporter.section(
				"issues",
				`Issues (${report.allIssues.length})`,
				HtmlReporter.tableBlock(
					["Severity", "Service", "Category", "Title", "Detail", "Fix"],
					report.allIssues.map((issue) => [
						HtmlReporter.severityBadge(issue.severity),
						HtmlReporter.escapeHtml(issue.service),
						HtmlReporter.escapeHtml(issue.category),
						HtmlReporter.escapeHtml(issue.title),
						HtmlReporter.escapeHtml(issue.detail),
						HtmlReporter.escapeHtml(issue.fix ?? ""),
					]),
					"No issues found.",
					true,
				),
			)}
      ${HtmlReporter.section(
				"recommendations",
				`Recommendations (${report.recommendations.length})`,
				report.recommendations.length === 0
					? "<p>No recommendations.</p>"
					: `<ul>${report.recommendations
							.map(
								(recommendation) =>
									`<li><strong>${HtmlReporter.escapeHtml(recommendation.priority.toUpperCase())}</strong> — ${HtmlReporter.escapeHtml(recommendation.service)}: ${HtmlReporter.escapeHtml(recommendation.message)}${recommendation.fix ? `<br /><code>${HtmlReporter.escapeHtml(recommendation.fix)}</code>` : ""}</li>`,
							)
							.join("")}</ul>`,
			)}
      ${report.dockerRuntime ? HtmlReporter.section("runtime", "Docker Runtime", HtmlReporter.runtimeBlock(report)) : ""}
    </main>
  </body>
</html>`;
	}

	private static runtimeBlock(report: FullComposeReport): string {
		const runtime = report.dockerRuntime;
		if (!runtime) {
			return "<p>Runtime collection disabled.</p>";
		}

		if (!runtime.available) {
			return `<p>${HtmlReporter.escapeHtml(runtime.error ?? "Docker runtime unavailable.")}</p>`;
		}

		return HtmlReporter.tableBlock(
			["Service", "Container", "State", "Status", "Health", "Image"],
			runtime.services.map((service) => [
				HtmlReporter.escapeHtml(service.service),
				HtmlReporter.escapeHtml(service.containerName ?? "—"),
				HtmlReporter.escapeHtml(service.state ?? "—"),
				HtmlReporter.escapeHtml(service.status ?? "—"),
				HtmlReporter.escapeHtml(service.health ?? "—"),
				HtmlReporter.escapeHtml(service.image ?? "—"),
			]),
			"No runtime information collected.",
		);
	}

	private static section(id: string, title: string, body: string): string {
		return `<section id="${id}"><div class="section-body"><h2>${title}</h2>${body}</div></section>`;
	}

	private static tableBlock(
		headers: string[],
		rows: string[][],
		emptyMessage: string,
		trustCellHtml = false,
	): string {
		if (rows.length === 0) {
			return `<p>${HtmlReporter.escapeHtml(emptyMessage)}</p>`;
		}

		return `<div class="table-wrap"><table><thead><tr>${headers
			.map((header) => `<th>${HtmlReporter.escapeHtml(header)}</th>`)
			.join("")}</tr></thead><tbody>${rows
			.map(
				(row) =>
					`<tr>${row
						.map(
							(cell) =>
								`<td>${trustCellHtml ? cell : HtmlReporter.escapeHtml(cell)}</td>`,
						)
						.join("")}</tr>`,
			)
			.join("")}</tbody></table></div>`;
	}

	private static summaryCard(label: string, value: string): string {
		return `<div class="card"><h3>${HtmlReporter.escapeHtml(label)}</h3><p>${HtmlReporter.escapeHtml(value)}</p></div>`;
	}

	private static severityBadge(severity: string): string {
		return `<span class="badge badge-${severity}">${HtmlReporter.escapeHtml(severity)}</span>`;
	}

	private static getHealthBadgeClass(score: number): string {
		if (score >= 90) return "badge-score-ok";
		if (score >= 70) return "badge-score-warn";
		if (score >= 50) return "badge-score-high";
		return "badge-score-critical";
	}

	private static escapeHtml(value: string): string {
		return value
			.replaceAll("&", "&amp;")
			.replaceAll("<", "&lt;")
			.replaceAll(">", "&gt;")
			.replaceAll('"', "&quot;")
			.replaceAll("'", "&#39;");
	}
}
