import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { resolvedIdentity, validateVisualReviewConfig } from "./config.mjs";
import { defaultReviewDecisions } from "./review.mjs";
import { assertNoSymlinkAncestors, exists, resolveContained, safeIdentifier } from "./util.mjs";

export const defaultRunId = (targetRevision, now = new Date()) => `${now.toISOString().replaceAll(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}-${targetRevision.slice(0, 7)}`;

export const resolveRunRoot = ({ config, repositoryRoot, runId, scope, output }) => {
  safeIdentifier(runId, "run"); safeIdentifier(scope, "scope");
  const relative = output ?? path.posix.join(config.evidence.root, config.evidence.scopeSegment ?? "scopes", scope, config.evidence.runsSegment ?? "runs", runId);
  return resolveContained(repositoryRoot, relative, "run output");
};

export const buildRunDescriptor = ({ config, repositoryRoot, runId, scope, reviewRoot, timestamp = new Date().toISOString() }) => {
  const identity = resolvedIdentity({ config, repositoryRoot });
  return {
    schemaVersion: "1.0.0",
    tool: { name: "@agentic-os/visual-review", version: "0.1.0" },
    scope,
    runId,
    timestamp,
    output: reviewRoot.relative,
    project: config.project,
    identity,
    reference: { ...config.reference, immutableRevision: identity.referenceRevision },
    target: { ...config.target, immutableRevision: identity.targetRevision },
    categories: config.categories,
    viewports: config.viewports,
    scenarios: config.scenarios,
    capture: config.capture,
    comparison: config.comparison,
    evidence: config.evidence,
    excludedStates: config.excludedStates ?? [],
    runtimeDriver: { identity: config.runtimeDriver.identity, provisional: true },
  };
};

export const createRun = async ({ config: rawConfig, repositoryRoot = process.cwd(), runId, scope = "visual-parity", output, now = new Date() }) => {
  const config = validateVisualReviewConfig(rawConfig);
  const identity = resolvedIdentity({ config, repositoryRoot });
  const resolvedRunId = runId ?? defaultRunId(identity.targetRevision, now);
  const reviewRoot = resolveRunRoot({ config, repositoryRoot, runId: resolvedRunId, scope, output });
  if (await exists(reviewRoot.absolute)) throw new Error(`Visual-review error: evidence directory already exists and will not be overwritten: ${reviewRoot.relative}`);
  await assertNoSymlinkAncestors(repositoryRoot, reviewRoot.relative, "run output");
  await mkdir(reviewRoot.absolute, { recursive: true });
  const run = buildRunDescriptor({ config, repositoryRoot, runId: resolvedRunId, scope, reviewRoot, timestamp: now.toISOString() });
  await writeFile(path.join(reviewRoot.absolute, "run.json"), `${JSON.stringify(run, null, 2)}\n`, { flag: "wx" });
  await writeFile(path.join(reviewRoot.absolute, "review-decisions.json"), `${JSON.stringify(defaultReviewDecisions(), null, 2)}\n`, { flag: "wx" });
  return { run, runRoot: reviewRoot.absolute, relative: reviewRoot.relative };
};

export const readCanonicalRun = async (runRoot) => JSON.parse(await readFile(path.join(runRoot, "run.json"), "utf8"));
