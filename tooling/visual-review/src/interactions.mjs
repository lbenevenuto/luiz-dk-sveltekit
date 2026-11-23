import { URL } from "node:url";

const locatorFor = (page, locator) => {
  let candidate;
  if (locator.kind === "role") candidate = page.getByRole(locator.role, { exact: locator.exact ?? true, name: locator.name });
  else if (locator.kind === "placeholder") candidate = page.getByPlaceholder(locator.placeholder, { exact: locator.exact ?? true });
  else if (locator.kind === "label") candidate = page.getByLabel(locator.label, { exact: locator.exact ?? true });
  else if (locator.kind === "text") candidate = page.getByText(locator.text, { exact: locator.exact ?? false });
  else throw new Error(`Unknown visual-review locator kind: ${locator.kind}`);
  return locator.nth === undefined ? candidate.first() : candidate.nth(locator.nth);
};

export const executeInteractionSteps = async ({ baseUrl, page, steps }) => {
  for (const step of steps) {
    if (step.action === "navigate") {
      const destination = new URL(step.path, baseUrl).toString();
      await page.goto(destination, { waitUntil: step.waitUntil ?? "networkidle" });
      continue;
    }
    const locator = locatorFor(page, step.locator);
    if (step.action === "click") await locator.click();
    else if (step.action === "fill") await locator.fill(step.value);
    else if (step.action === "type") await locator.pressSequentially(step.value, { delay: step.delayMs ?? 0 });
    else if (step.action === "select") await locator.selectOption(step.value);
    else if (step.action === "wait-visible") await locator.waitFor({ state: "visible", timeout: step.timeoutMs });
    else throw new Error(`Unknown visual-review interaction action: ${step.action}`);
  }
};

export const describeInteractionSteps = (steps) => {
  if (steps.length === 0) return "No post-navigation interaction";
  return steps.map((step) => {
    if (step.action === "navigate") return `navigate ${step.path}`;
    const locator = step.locator;
    const target = locator.name ?? locator.placeholder ?? locator.label ?? locator.text ?? locator.kind;
    if (step.action === "fill" || step.action === "type") return `${step.action} "${step.value}" via ${locator.kind}`;
    if (step.action === "select") return `select "${Array.isArray(step.value) ? step.value.join(",") : step.value}" for ${target}`;
    return `${step.action} "${target}"`;
  }).join(" → ");
};
