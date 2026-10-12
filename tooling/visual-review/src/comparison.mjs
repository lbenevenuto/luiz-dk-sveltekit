import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { comparePng, cropPng, sha256 } from "./png-comparison.mjs";
import { TERMINAL_HUMAN_STATUSES, readReviewDecisions } from "./review.mjs";
import { exists } from "./util.mjs";

const portable = (...segments) => path.posix.join(...segments);

export const classifyDifferenceRegion = ({ bounds, rules = [], viewport }) => {
  const match = rules.find(({ maxYExclusive, minXFractionExclusive }) =>
    (maxYExclusive === undefined || bounds.minY < maxYExclusive) &&
    (minXFractionExclusive === undefined || bounds.minX > viewport.width * minXFractionExclusive));
  return match?.label ?? "reported screenshot bounds";
};

export const compareRun = async ({ runRoot }) => {
  const comparisonFile = path.join(runRoot, "comparison.json");
  if (await exists(comparisonFile)) throw new Error("Visual-review error: comparison phase is already complete and immutable");
  if (!(await exists(path.join(runRoot, "capture-complete.json")))) throw new Error("Visual-review error: capture phase is incomplete");
  const decisions = await readReviewDecisions(runRoot);
  if (TERMINAL_HUMAN_STATUSES.has(decisions.status)) throw new Error("Visual-review error: terminal Human-reviewed run cannot be recomputed");
  const run = JSON.parse(await readFile(path.join(runRoot, "run.json"), "utf8"));
  const pairs = [];
  for (const scenario of run.scenarios) {
    const applicable = new Set(scenario.viewports ?? run.viewports.map(({ id }) => id));
    for (const viewport of run.viewports) {
      if (!applicable.has(viewport.id)) continue;
      const screenshot = portable(viewport.id, `${scenario.id}.png`);
      const referenceRelative = portable("screenshots", "reference", "capture", screenshot);
      const targetRelative = portable("screenshots", "target", "capture", screenshot);
      const [reference, target] = await Promise.all([readFile(path.join(runRoot, referenceRelative)), readFile(path.join(runRoot, targetRelative))]);
      const raw = comparePng(reference, target);
      let crops;
      let differenceRegion;
      if (raw.bounds) {
        const cropDirectory = portable("diffs", viewport.id);
        await mkdir(path.join(runRoot, cropDirectory), { recursive: true });
        const referenceCrop = portable(cropDirectory, `${scenario.id}-reference.png`);
        const targetCrop = portable(cropDirectory, `${scenario.id}-target.png`);
        const padding = run.comparison?.cropPadding ?? 8;
        await Promise.all([
          writeFile(path.join(runRoot, referenceCrop), cropPng(reference, raw.bounds, padding), { flag: "wx" }),
          writeFile(path.join(runRoot, targetCrop), cropPng(target, raw.bounds, padding), { flag: "wx" }),
        ]);
        crops = { reference: referenceCrop, target: targetCrop };
        differenceRegion = classifyDifferenceRegion({ bounds: raw.bounds, rules: run.comparison?.regionRules, viewport });
      }
      const dimensions = raw.exact || raw.dimensionsMatch !== false
        ? { width: raw.width ?? viewport.width, height: raw.height ?? viewport.height }
        : raw.dimensions;
      pairs.push({
        key: `${scenario.id}::${viewport.id}`,
        scenarioId: scenario.id,
        viewportId: viewport.id,
        automatedResult: raw.exact ? "exact-match" : "reported-difference",
        differingPixels: raw.differingPixels,
        dimensionsMatch: raw.dimensions?.left ? false : true,
        dimensions,
        bounds: raw.bounds ?? null,
        differenceRegion: differenceRegion ?? null,
        crops: crops ?? null,
        reference: { path: referenceRelative, sha256: sha256(reference), width: dimensions?.width ?? viewport.width, height: dimensions?.height ?? viewport.height },
        target: { path: targetRelative, sha256: sha256(target), width: dimensions?.width ?? viewport.width, height: dimensions?.height ?? viewport.height },
      });
    }
  }
  const exact = pairs.filter(({ automatedResult }) => automatedResult === "exact-match").length;
  const output = {
    schemaVersion: "1.0.0",
    generatedAt: new Date().toISOString(),
    automatedComparison: {
      total: pairs.length,
      exact,
      different: pairs.length - exact,
      policy: "Automated exact RGBA comparison is evidence and triage; Human visual review is final authority",
    },
    pairs,
  };
  await writeFile(comparisonFile, `${JSON.stringify(output, null, 2)}\n`, { flag: "wx" });
  return output;
};
