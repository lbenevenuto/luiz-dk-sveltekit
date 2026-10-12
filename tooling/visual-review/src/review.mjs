import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { assert, exists } from "./util.mjs";

export const HUMAN_STATUSES = ["pending-review", "human-accepted", "human-rejected"];
export const TERMINAL_HUMAN_STATUSES = new Set(["human-accepted", "human-rejected"]);

export const defaultReviewDecisions = () => ({ schemaVersion: "1.0.0", status: "pending-review", reviewer: null, reviewedAt: null, pairs: {} });

const validateDecision = (decision, label) => {
  assert(HUMAN_STATUSES.includes(decision.status), `invalid Human-review status for ${label}: ${decision.status}`);
  if (TERMINAL_HUMAN_STATUSES.has(decision.status)) {
    assert(typeof decision.reviewer === "string" && decision.reviewer.length > 0, `${label} terminal decision requires reviewer`);
    assert(typeof decision.reviewedAt === "string" && decision.reviewedAt.length > 0, `${label} terminal decision requires reviewedAt`);
  }
};

export const validateReviewDecisions = (input, { knownPairKeys } = {}) => {
  assert(input?.schemaVersion === "1.0.0", "review schemaVersion must be 1.0.0");
  validateDecision(input, "overall review");
  for (const [key, decision] of Object.entries(input.pairs ?? {})) {
    if (knownPairKeys) assert(knownPairKeys.has(key), `unknown pair decision key ${key}`);
    validateDecision(decision, `pair ${key}`);
  }
  return input;
};

export const readReviewDecisions = async (runRoot) => {
  const file = path.join(runRoot, "review-decisions.json");
  if (!(await exists(file))) return defaultReviewDecisions();
  return validateReviewDecisions(JSON.parse(await readFile(file, "utf8")));
};

export const writeReviewDecisions = async (runRoot, next, { knownPairKeys } = {}) => {
  const file = path.join(runRoot, "review-decisions.json");
  const current = await readReviewDecisions(runRoot);
  if (TERMINAL_HUMAN_STATUSES.has(current.status)) throw new Error(`Visual-review error: Human review is terminal (${current.status}) and cannot be changed`);
  validateReviewDecisions(next, { knownPairKeys });
  await writeFile(file, `${JSON.stringify(next, null, 2)}\n`);
  return next;
};
