import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { captureScenarioPage } from "./capture-sequence.mjs";
import { validateVisualReviewConfig } from "./config.mjs";
import { TERMINAL_HUMAN_STATUSES, readReviewDecisions } from "./review.mjs";
import { exists } from "./util.mjs";

export const captureRun = async ({ config: rawConfig, runRoot, repositoryRoot = process.cwd() }) => {
  const config = validateVisualReviewConfig(rawConfig);
  const run = JSON.parse(await readFile(path.join(runRoot, "run.json"), "utf8"));
  const decisions = await readReviewDecisions(runRoot);
  if (TERMINAL_HUMAN_STATUSES.has(decisions.status)) throw new Error("Visual-review error: terminal Human-reviewed run cannot be recaptured");
  if (await exists(path.join(runRoot, "capture-complete.json"))) throw new Error("Visual-review error: capture phase is already complete and immutable");

  const statusFile = path.join(runRoot, "capture-status.json");
  await writeFile(statusFile, `${JSON.stringify({ status: "in-progress", startedAt: new Date().toISOString() }, null, 2)}\n`);
  const driver = config.runtimeDriver;
  try {
    await driver.prepare({ config, run, runRoot, repositoryRoot, adapter: config.projectAdapter });
    const runtimeEvidence = await driver.collectEvidence({ config, run, runRoot, repositoryRoot, adapter: config.projectAdapter });
    await writeFile(path.join(runRoot, "runtime.json"), `${JSON.stringify({ driver: driver.identity, evidence: runtimeEvidence ?? {} }, null, 2)}\n`, { flag: "wx" });
    for (const side of ["reference", "target"]) {
      await driver.capture({
        side, config, run, runRoot, repositoryRoot, adapter: config.projectAdapter,
        captureScenario: (context) => captureScenarioPage({ ...context, adapter: config.projectAdapter, run, runRoot, side }),
      });
    }
    const completed = { status: "completed", completedAt: new Date().toISOString(), driver: driver.identity };
    await writeFile(path.join(runRoot, "capture-complete.json"), `${JSON.stringify(completed, null, 2)}\n`, { flag: "wx" });
    await writeFile(statusFile, `${JSON.stringify(completed, null, 2)}\n`);
    return completed;
  } catch (error) {
    await writeFile(statusFile, `${JSON.stringify({ status: "failed", failedAt: new Date().toISOString(), error: String(error.message ?? error) }, null, 2)}\n`);
    throw error;
  } finally {
    await driver.cleanup?.({ config, run, runRoot, repositoryRoot, adapter: config.projectAdapter });
  }
};
