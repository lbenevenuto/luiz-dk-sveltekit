import { defineVisualReviewConfig } from "../src/index.mjs";

// Replace the example RuntimeDriver with a project-owned real browser/runtime driver.
const runtimeDriver = {
  identity: { name: "project-runtime", version: "replace-me", browser: "replace-me" },
  async prepare() { throw new Error("Configure a project RuntimeDriver before capture"); },
  async capture() { throw new Error("Configure a project RuntimeDriver before capture"); },
  async collectEvidence() { return {}; },
};

export default defineVisualReviewConfig({
  schemaVersion: "1.0.0",
  project: { id: "example-project", labels: { category: "Category", reference: "Reference", target: "Target" } },
  reference: {
    id: "approved-reference",
    label: "Approved Reference",
    immutableRevision: "REFERENCE_SHA_OR_VERSION",
    sourceKind: "local-executable",
    baseUrls: { app: "http://127.0.0.1:4100" },
  },
  target: {
    id: "target-implementation",
    label: "Target Implementation",
    immutableRevision: "TARGET_SHA",
    sourceKind: "local-executable",
    baseUrls: { app: "http://127.0.0.1:4200" },
  },
  categories: [{ id: "app", label: "Application" }],
  viewports: [{ id: "desktop", label: "Desktop", width: 1440, height: 900, deviceScaleFactor: 1 }],
  scenarios: [{
    id: "home-default",
    name: "Home — default",
    category: "app",
    route: "/",
    state: "default",
    context: "Initial page state",
    expected: { text: "Replace with an observable expected state" },
    interactions: [],
    viewports: ["desktop"],
  }],
  evidence: { root: ".agentic-evidence/visual-review", scopeSegment: "scopes", runsSegment: "runs", retention: "immutable" },
  capture: { fixedTime: "2026-01-01T12:00:00Z", geometrySelector: "body", fullPage: true },
  runtimeDriver,
});
