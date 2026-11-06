#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import path from "node:path";

import { captureRun, compareRun, createRun, generateReport, validateRun } from "../src/index.mjs";

const args = process.argv.slice(2);
const command = args.shift() ?? "run";
const allowed = new Set(["capture", "compare", "report", "validate", "run", "open"]);
if (!allowed.has(command)) throw new Error(`visual-review command must be one of: ${[...allowed].join(", ")}`);
const options = {};
for (let i = 0; i < args.length; i += 1) {
  const key = args[i];
  if (!key.startsWith("--")) throw new Error(`Unknown argument ${key}`);
  const value = args[i + 1];
  if (!value) throw new Error(`Missing value for ${key}`);
  options[key.slice(2)] = value; i += 1;
}
if (!options.config) throw new Error("--config <module> is required");
const configModule = await import(pathToFileURL(path.resolve(options.config)).href);
const config = configModule.default ?? configModule.visualReviewConfig ?? configModule.config;
if (!config) throw new Error("Config module must export default/config/visualReviewConfig");
const repositoryRoot = path.resolve(options.repository ?? process.cwd());
let runRoot;
if (command === "capture" || command === "run") {
  const created = await createRun({ config, repositoryRoot, runId: options.run, scope: options.scope ?? "visual-parity", output: options.output });
  runRoot = created.runRoot;
  await captureRun({ config, runRoot, repositoryRoot });
} else {
  if (!options.output) throw new Error(`${command} requires --output <existing-run-root>`);
  runRoot = path.resolve(repositoryRoot, options.output);
}
if (command === "compare" || command === "run") await compareRun({ runRoot });
if (command === "report" || command === "run") await generateReport({ runRoot });
if (command === "validate" || command === "run") await validateRun({ runRoot, config, repositoryRoot, browser: false });
if (command === "open") {
  const { spawnSync } = await import("node:child_process");
  const report = path.join(runRoot, "index.html");
  const platform = process.platform;
  const invocation = platform === "darwin" ? ["open", [report]] : platform === "win32" ? ["cmd", ["/c", "start", "", report]] : ["xdg-open", [report]];
  const result = spawnSync(invocation[0], invocation[1], { stdio: "inherit" });
  if (result.status !== 0) throw new Error(`open failed with status ${result.status}`);
}
console.log(`VISUAL REVIEW ${command.toUpperCase()} COMPLETE: ${runRoot}`);
