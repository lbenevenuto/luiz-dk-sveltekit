import { execFileSync } from "node:child_process";

import { assert, safeIdentifier, sha256Json } from "./util.mjs";

const SUPPORTED_ACTIONS = new Set(["click", "fill", "navigate", "select", "type", "wait-visible"]);
const SUPPORTED_LOCATORS = new Set(["role", "placeholder", "label", "text"]);

const validateSource = (descriptor, label) => {
  assert(descriptor?.id, `${label}.id is required`);
  safeIdentifier(descriptor.id, `${label}.id`);
  assert(descriptor?.label, `${label}.label is required`);
  assert(descriptor?.baseUrls && typeof descriptor.baseUrls === "object", `${label}.baseUrls is required`);
  if (label === "reference") assert(descriptor.immutableRevision, "reference.immutableRevision is required");
  if (label === "target") {
    assert(
      descriptor.immutableRevision || descriptor.metadata?.immutableRevisionResolver === "git-head",
      "target requires immutableRevision or metadata.immutableRevisionResolver='git-head'",
    );
  }
};

const validateLocator = (locator, scenarioId) => {
  assert(locator && typeof locator === "object", `${scenarioId} interaction locator is required`);
  assert(SUPPORTED_LOCATORS.has(locator.kind), `${scenarioId} uses unsupported locator kind ${locator.kind}`);
  if (locator.kind === "role") assert(locator.role, `${scenarioId} role locator requires role`);
  if (locator.kind === "placeholder") assert(locator.placeholder, `${scenarioId} placeholder locator requires placeholder`);
  if (locator.kind === "label") assert(locator.label, `${scenarioId} label locator requires label`);
  if (locator.kind === "text") assert(locator.text, `${scenarioId} text locator requires text`);
  if (locator.nth !== undefined) assert(Number.isInteger(locator.nth) && locator.nth >= 0, `${scenarioId} locator.nth must be a non-negative integer`);
};

const validateInteraction = (step, scenarioId) => {
  assert(SUPPORTED_ACTIONS.has(step.action), `${scenarioId} uses unsupported action ${step.action}`);
  if (step.action === "navigate") {
    assert(typeof step.path === "string" && step.path.startsWith("/"), `${scenarioId} navigate.path must be same-origin relative`);
    return;
  }
  validateLocator(step.locator, scenarioId);
  if (["fill", "type"].includes(step.action)) assert(typeof step.value === "string", `${scenarioId} ${step.action} requires string value`);
  if (step.action === "select") assert(typeof step.value === "string" || Array.isArray(step.value), `${scenarioId} select requires value`);
};

export const validateVisualReviewConfig = (input) => {
  assert(input && typeof input === "object", "configuration object is required");
  assert(input.schemaVersion === "1.0.0", "schemaVersion must be 1.0.0");
  assert(input.project?.id, "project.id is required");
  safeIdentifier(input.project.id, "project.id");
  validateSource(input.reference, "reference");
  validateSource(input.target, "target");
  assert(Array.isArray(input.categories) && input.categories.length > 0, "at least one category is required");
  assert(Array.isArray(input.viewports) && input.viewports.length > 0, "at least one viewport is required");
  assert(Array.isArray(input.scenarios) && input.scenarios.length > 0, "at least one scenario is required");
  assert(input.runtimeDriver && typeof input.runtimeDriver === "object", "runtimeDriver is required");

  const categoryIds = new Set();
  for (const category of input.categories) {
    assert(category.id && category.label, "categories require id and label");
    safeIdentifier(category.id, `category ${category.id || "<missing>"}`);
    assert(!categoryIds.has(category.id), `duplicate category id ${category.id}`);
    categoryIds.add(category.id);
  }
  for (const [side, descriptor] of [["reference", input.reference], ["target", input.target]]) {
    for (const categoryId of categoryIds) assert(descriptor.baseUrls[categoryId], `${side}.baseUrls is missing category ${categoryId}`);
  }

  const viewportIds = new Set();
  for (const viewport of input.viewports) {
    assert(viewport.id && viewport.label, "viewports require id and label");
    safeIdentifier(viewport.id, `viewport ${viewport.id || "<missing>"}`);
    assert(!viewportIds.has(viewport.id), `duplicate viewport id ${viewport.id}`);
    viewportIds.add(viewport.id);
    assert(Number.isInteger(viewport.width) && viewport.width > 0, `${viewport.id}.width must be a positive integer`);
    assert(Number.isInteger(viewport.height) && viewport.height > 0, `${viewport.id}.height must be a positive integer`);
  }

  const scenarioIds = new Set();
  for (const scenario of input.scenarios) {
    assert(scenario.id && scenario.name, "scenarios require id and name");
    safeIdentifier(scenario.id, `scenario ${scenario.id || "<missing>"}`);
    assert(!scenarioIds.has(scenario.id), `duplicate scenario id ${scenario.id}`);
    scenarioIds.add(scenario.id);
    assert(categoryIds.has(scenario.category), `${scenario.id} references unknown category ${scenario.category}`);
    assert(typeof scenario.route === "string" && scenario.route.startsWith("/"), `${scenario.id}.route must be same-origin relative`);
    assert(typeof scenario.state === "string", `${scenario.id}.state is required`);
    assert(typeof scenario.context === "string", `${scenario.id}.context is required`);
    assert(Array.isArray(scenario.interactions), `${scenario.id}.interactions must be an array`);
    for (const step of scenario.interactions) validateInteraction(step, scenario.id);
    const selected = scenario.viewports ?? [...viewportIds];
    assert(selected.length > 0, `${scenario.id} must apply to at least one viewport`);
    for (const viewportId of selected) assert(viewportIds.has(viewportId), `${scenario.id} references unknown viewport ${viewportId}`);
  }

  const adapter = input.projectAdapter ?? {};
  const allowedAdapterHooks = new Set(["prepareContext", "preparePage", "assertPage"]);
  for (const hook of Object.keys(adapter)) assert(allowedAdapterHooks.has(hook), `projectAdapter.${hook} is not part of the 0.1.0 adapter boundary`);
  for (const hook of allowedAdapterHooks) assert(adapter[hook] === undefined || typeof adapter[hook] === "function", `projectAdapter.${hook} must be a function when provided`);

  const driver = input.runtimeDriver;
  assert(driver.identity && typeof driver.identity === "object", "runtimeDriver.identity is required");
  for (const method of ["prepare", "capture", "collectEvidence"]) assert(typeof driver[method] === "function", `runtimeDriver.${method}() is required`);
  assert(driver.cleanup === undefined || typeof driver.cleanup === "function", "runtimeDriver.cleanup must be a function when provided");
  assert(driver.validateBrowser === undefined || typeof driver.validateBrowser === "function", "runtimeDriver.validateBrowser must be a function when provided");

  assert(input.evidence?.root, "evidence.root is required");
  return Object.freeze({
    ...input,
    comparison: { cropPadding: 8, regionRules: [], ...(input.comparison ?? {}) },
    project: { ...input.project, labels: { reference: "Reference", target: "Target", category: "Category", ...(input.project.labels ?? {}) } },
    projectAdapter: adapter,
  });
};

export const defineVisualReviewConfig = (input) => validateVisualReviewConfig(input);

export const resolveImmutableRevision = (repositoryRoot, descriptor, label) => {
  if (descriptor.immutableRevision) return descriptor.immutableRevision;
  if (descriptor.metadata?.immutableRevisionResolver === "git-head") {
    return execFileSync("git", ["rev-parse", "HEAD"], { cwd: repositoryRoot, encoding: "utf8" }).trim();
  }
  throw new Error(`Visual-review error: ${label} immutable revision cannot be resolved`);
};

export const resolvedIdentity = ({ config, repositoryRoot }) => {
  const referenceRevision = resolveImmutableRevision(repositoryRoot, config.reference, "reference");
  const targetRevision = resolveImmutableRevision(repositoryRoot, config.target, "target");
  const scenarioMatrix = config.scenarios.map(({ id, name, category, route, state, context, interactions, viewports, expected }) => ({ id, name, category, route, state, context, interactions, viewports: viewports ?? null, expected: expected ?? null }));
  const used = new Set(config.scenarios.flatMap((scenario) => scenario.viewports ?? config.viewports.map(({ id }) => id)));
  const viewportMatrix = config.viewports.filter(({ id }) => used.has(id)).map(({ id, label, width, height, deviceScaleFactor }) => ({ id, label, width, height, deviceScaleFactor: deviceScaleFactor ?? 1 }));
  return {
    referenceRevision,
    targetRevision,
    scenarioMatrixSha256: sha256Json(scenarioMatrix),
    viewportMatrixSha256: sha256Json(viewportMatrix),
  };
};
