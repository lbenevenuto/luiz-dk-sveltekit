import { createHash } from "node:crypto";
import { lstat, readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { resolvedIdentity, validateVisualReviewConfig } from "./config.mjs";
import { sha256 } from "./png-comparison.mjs";
import { readReviewDecisions, validateReviewDecisions } from "./review.mjs";
import { assert, assertRelativePortablePath, exists, readJson } from "./util.mjs";

const hashFile = async (file) => createHash("sha256").update(await readFile(file)).digest("hex");

const walk = async (root, prefix = "") => {
  const output = [];
  for (const entry of await readdir(path.join(root, prefix), { withFileTypes: true })) {
    const relative = path.posix.join(prefix.split(path.sep).join("/"), entry.name);
    if (entry.isDirectory()) output.push(...await walk(root, relative));
    else if (entry.isFile()) output.push(relative);
  }
  return output.sort();
};

export const buildIntegrityIndex = async (runRoot) => {
  const files = await walk(runRoot);
  const entries = [];
  for (const relative of files) entries.push({ path: relative, sha256: await hashFile(path.join(runRoot, relative)) });
  return { algorithm: "sha256", entries };
};

export const assessStaleness = ({ run, config, repositoryRoot }) => {
  const current = resolvedIdentity({ config: validateVisualReviewConfig(config), repositoryRoot });
  const changed = Object.entries(current).filter(([key, value]) => run.identity?.[key] !== value).map(([key]) => key);
  return { stale: changed.length > 0, parityStatus: changed.length > 0 ? "STALE" : run ? "CURRENT" : "UNKNOWN", changed };
};

export const validateRun = async ({ runRoot, config, repositoryRoot = process.cwd(), browser = false }) => {
  const [run, comparison, manifest, summary] = await Promise.all([
    readJson(path.join(runRoot, "run.json")), readJson(path.join(runRoot, "comparison.json")), readJson(path.join(runRoot, "manifest.json")), readJson(path.join(runRoot, "summary.json")),
  ]);
  const expectedPairs = run.scenarios.reduce((total, scenario) => total + (scenario.viewports?.length ?? run.viewports.length), 0);
  assert(comparison.pairs.length === expectedPairs, `expected ${expectedPairs} comparison pairs; found ${comparison.pairs.length}`);
  assert(manifest.pairs.length === expectedPairs, `expected ${expectedPairs} manifest pairs; found ${manifest.pairs.length}`);
  assert(summary.humanReview.finalAuthority === "Human visual review", "Human visual authority contract is missing");
  const html = await readFile(path.join(runRoot, "index.html"), "utf8");
  for (const control of ['id="category"', 'id="viewport"', 'id="diff"', 'id="review"']) assert(html.includes(control), `missing report filter ${control}`);
  const knownPairKeys = new Set(comparison.pairs.map(({ key }) => key));
  validateReviewDecisions(await readReviewDecisions(runRoot), { knownPairKeys });
  for (const pair of comparison.pairs) {
    for (const side of ["reference", "target"]) {
      const evidence = pair[side];
      const relative = evidence.path;
      assertRelativePortablePath(relative, `${pair.key} ${side} path`);
      const absolute = path.resolve(runRoot, relative);
      assert(absolute.startsWith(`${path.resolve(runRoot)}${path.sep}`), `${pair.key} ${side} path escapes run root`);
      const info = await lstat(absolute);
      assert(!info.isSymbolicLink(), `${pair.key} ${side} asset must not be a symbolic link`);
      assert(info.isFile(), `${pair.key} ${side} asset is not a file`);
      const contents = await readFile(absolute);
      assert(sha256(contents) === evidence.sha256, `${pair.key} ${side} SHA-256 mismatch`);
    }
    for (const crop of [pair.crops?.reference, pair.crops?.target].filter(Boolean)) {
      assertRelativePortablePath(crop, `${pair.key} crop path`);
      assert(await exists(path.resolve(runRoot, crop)), `${pair.key} crop is missing`);
    }
  }
  const decisions = await readReviewDecisions(runRoot);
  let staleness = null;
  if (config) staleness = assessStaleness({ run, config, repositoryRoot });
  if (browser) {
    const driver = config?.runtimeDriver;
    if (!driver?.validateBrowser) throw new Error("Visual-review error: browser validation requested but runtimeDriver.validateBrowser() is unavailable");
    await driver.validateBrowser({ run, runRoot, manifest });
  }
  return { valid: true, expectedPairs, decisions, staleness, integrity: await buildIntegrityIndex(runRoot) };
};
