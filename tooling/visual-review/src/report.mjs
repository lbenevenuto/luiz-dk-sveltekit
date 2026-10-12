import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { HUMAN_STATUSES, TERMINAL_HUMAN_STATUSES, readReviewDecisions, validateReviewDecisions } from "./review.mjs";
import { exists } from "./util.mjs";

const escapeHtml = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

const enrichPair = ({ pair, run, decisions }) => {
  const scenario = run.scenarios.find(({ id }) => id === pair.scenarioId);
  const viewport = run.viewports.find(({ id }) => id === pair.viewportId);
  if (!scenario || !viewport) throw new Error(`Visual-review error: comparison pair ${pair.key} references unknown scenario or viewport`);
  const explicit = decisions.pairs?.[pair.key];
  const inherited = TERMINAL_HUMAN_STATUSES.has(decisions.status) ? decisions.status : "pending-review";
  const humanReview = explicit ?? { status: inherited, reviewer: decisions.reviewer ?? null, reviewedAt: decisions.reviewedAt ?? null };
  if (!HUMAN_STATUSES.includes(humanReview.status)) throw new Error(`Invalid Human-review status for ${pair.key}: ${humanReview.status}`);
  return {
    ...pair,
    id: scenario.id,
    name: scenario.name,
    category: scenario.category,
    route: scenario.route,
    state: scenario.state,
    context: scenario.context,
    expected: scenario.expected,
    interactions: scenario.interactions,
    viewport,
    exact: pair.automatedResult === "exact-match",
    referencePath: pair.reference.path,
    targetPath: pair.target.path,
    referenceCrop: pair.crops?.reference ?? null,
    targetCrop: pair.crops?.target ?? null,
    humanReview,
  };
};

export const mergeHumanDecisions = ({ comparison, run, decisions }) => {
  validateReviewDecisions(decisions, { knownPairKeys: new Set(comparison.pairs.map(({ key }) => key)) });
  return comparison.pairs.map((pair) => enrichPair({ pair, run, decisions }));
};

export const generateReport = async ({ runRoot, allowTerminalRegeneration = false }) => {
  const [run, comparison, decisions] = await Promise.all([
    readFile(path.join(runRoot, "run.json"), "utf8").then(JSON.parse),
    readFile(path.join(runRoot, "comparison.json"), "utf8").then(JSON.parse),
    readReviewDecisions(runRoot),
  ]);
  const reportFiles = ["manifest.json", "summary.json", "index.html"];
  if (TERMINAL_HUMAN_STATUSES.has(decisions.status) && !allowTerminalRegeneration && (await Promise.all(reportFiles.map((file) => exists(path.join(runRoot, file))))).some(Boolean)) {
    throw new Error("Visual-review error: terminal Human-reviewed report evidence will not be silently overwritten; explicit allowTerminalRegeneration is required");
  }
  const pairs = mergeHumanDecisions({ comparison, run, decisions });
  const counts = Object.fromEntries(HUMAN_STATUSES.map((status) => [status, pairs.filter((pair) => pair.humanReview.status === status).length]));
  const summary = {
    schemaVersion: "1.0.0",
    generatedAt: new Date().toISOString(),
    scope: run.scope,
    runId: run.runId,
    reference: run.reference,
    target: run.target,
    identity: run.identity,
    scenarios: run.scenarios.length,
    viewports: run.viewports,
    automatedComparison: comparison.automatedComparison,
    humanReview: { counts, finalAuthority: "Human visual review", overall: decisions },
    status: decisions.status,
  };
  await writeFile(path.join(runRoot, "manifest.json"), `${JSON.stringify({ run, summary, pairs }, null, 2)}\n`);
  await writeFile(path.join(runRoot, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  const categoryLabel = run.project?.labels?.category ?? "Category";
  const referenceLabel = run.project?.labels?.reference ?? "Reference";
  const targetLabel = run.project?.labels?.target ?? "Target";
  const cards = pairs.map((pair) => `
<article class="pair" data-category="${escapeHtml(pair.category)}" data-viewport="${escapeHtml(pair.viewport.id)}" data-diff="${pair.exact ? "exact" : "different"}" data-review="${escapeHtml(pair.humanReview.status)}">
<header><div><h2>${escapeHtml(pair.name ?? pair.id)}</h2><p>${escapeHtml(pair.category)} · ${escapeHtml(pair.route)} · ${escapeHtml(pair.state)} · ${pair.viewport.width}×${pair.viewport.height}</p></div><div class="statuses"><strong>${pair.exact ? "Exact automated match" : `${pair.differingPixels ?? "dimension"}-pixel automated difference`}</strong><span class="review-status">${escapeHtml(pair.humanReview.status)}</span></div></header>
<p class="state">Context: ${escapeHtml(pair.context)}</p>${pair.expected?.text ? `<p class="state">Expected: ${escapeHtml(Array.isArray(pair.expected.text) ? pair.expected.text.join(" · ") : pair.expected.text)}</p>` : ""}
${pair.bounds ? `<p class="difference">Difference: ${escapeHtml(pair.differenceRegion)} · bounds x ${pair.bounds.minX}–${pair.bounds.maxX}, y ${pair.bounds.minY}–${pair.bounds.maxY}</p><div class="crops"><figure><figcaption>${escapeHtml(referenceLabel)} crop · pixel zoom</figcaption><img src="${escapeHtml(pair.referenceCrop)}"></figure><figure><figcaption>${escapeHtml(targetLabel)} crop · pixel zoom</figcaption><img src="${escapeHtml(pair.targetCrop)}"></figure></div>` : ""}
<div class="images"><figure><figcaption>${escapeHtml(referenceLabel)} · ${escapeHtml(run.reference.label)} ${escapeHtml(run.reference.version ?? "")} · ${escapeHtml(run.reference.immutableRevision)}</figcaption><img loading="lazy" src="${escapeHtml(pair.referencePath)}"></figure><figure><figcaption>${escapeHtml(targetLabel)} · ${escapeHtml(run.target.label)} · ${escapeHtml(run.target.immutableRevision)}</figcaption><img loading="lazy" src="${escapeHtml(pair.targetPath)}"></figure></div></article>`).join("\n");
  const categories = [...new Set(pairs.map(({ category }) => category))];
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(run.scope)} Visual Review</title><style>:root{color-scheme:light;font-family:system-ui,sans-serif}body{margin:0;background:#f4f5f7;color:#17191c}.top{position:sticky;top:0;z-index:2;padding:16px 20px;border-bottom:1px solid #d8dce2;background:#fff}h1{margin:0;font-size:22px}.meta,.controls{display:flex;flex-wrap:wrap;gap:8px 16px;margin-top:8px;font-size:13px}select{padding:5px 8px}main{padding:20px}.pair{margin:0 0 24px;padding:16px;border:1px solid #d8dce2;background:#fff}.pair header{display:flex;justify-content:space-between;gap:16px;align-items:start}h2{margin:0;font-size:18px}.pair p{margin:4px 0;font-size:12px;color:#565d67}.statuses{display:grid;justify-items:end;gap:4px;font-size:12px}.review-status{border:1px solid #b9bec6;border-radius:999px;padding:2px 7px;text-transform:uppercase}.difference{font-weight:700;color:#842029!important}.images{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px}.crops{display:flex;flex-wrap:wrap;gap:12px;margin-top:12px}.crops img{width:auto;min-width:320px;image-rendering:pixelated}figure{margin:0;min-width:0}figcaption{margin-bottom:6px;font-weight:700;font-size:12px}img{display:block;width:100%;height:auto;border:1px solid #d8dce2}@media(max-width:900px){.images{grid-template-columns:1fr}}</style></head><body><section class="top"><h1>${escapeHtml(run.scope)} visual parity human review</h1><div class="meta"><span>${escapeHtml(referenceLabel)}: ${escapeHtml(run.reference.label)} ${escapeHtml(run.reference.version ?? "")} · ${escapeHtml(run.reference.immutableRevision)}</span><span>${escapeHtml(targetLabel)}: ${escapeHtml(run.target.label)} · ${escapeHtml(run.target.immutableRevision)}</span><span>${pairs.length} pairs · ${comparison.automatedComparison.exact} exact · ${comparison.automatedComparison.different} reported differences</span><span>Human authority: ${escapeHtml(decisions.status)}</span></div><div class="controls"><label>${escapeHtml(categoryLabel)} <select id="category"><option value="all">All</option>${categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("")}</select></label><label>Viewport <select id="viewport"><option value="all">All</option>${run.viewports.map((viewport) => `<option value="${escapeHtml(viewport.id)}">${viewport.width}×${viewport.height}</option>`).join("")}</select></label><label>Diff <select id="diff"><option value="all">All</option><option value="different">Reported differences</option><option value="exact">Exact automated match</option></select></label><label>Review <select id="review"><option value="all">All</option>${HUMAN_STATUSES.map((status) => `<option value="${status}">${status}</option>`).join("")}</select></label></div></section><main>${cards}</main><script>const filters=["category","viewport","diff","review"];const apply=()=>document.querySelectorAll(".pair").forEach((card)=>{card.hidden=filters.some((id)=>{const value=document.getElementById(id).value;return value!=="all"&&card.dataset[id]!==value})});filters.forEach((id)=>document.getElementById(id).addEventListener("change",apply));</script></body></html>`;
  await writeFile(path.join(runRoot, "index.html"), html);
  return { pairs, summary };
};
