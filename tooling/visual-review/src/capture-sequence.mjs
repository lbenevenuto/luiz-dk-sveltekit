import path from "node:path";
import { mkdir } from "node:fs/promises";

import { executeInteractionSteps } from "./interactions.mjs";

const resolveBaseUrl = (descriptor, category) => descriptor.baseUrls?.[category];

const waitForObservableState = async (page, expected) => {
  if (!expected?.text) return;
  const texts = Array.isArray(expected.text) ? expected.text : [expected.text];
  for (const text of texts) await page.getByText(text, { exact: false }).first().waitFor({ state: "visible" });
};

const waitForStableGeometry = async (page, selector) => {
  if (!selector) return;
  await page.evaluate(async (stableSelector) => {
    const snapshot = () => JSON.stringify([...document.querySelectorAll(stableSelector)].map((element) => {
      const rect = element.getBoundingClientRect();
      return [element.tagName, Math.round(rect.x * 1000) / 1000, Math.round(rect.y * 1000) / 1000, Math.round(rect.width * 1000) / 1000, Math.round(rect.height * 1000) / 1000];
    }));
    const nextFrame = () => new Promise((resolve) => document.defaultView.requestAnimationFrame(resolve));
    let previous = snapshot();
    for (let frame = 1; frame <= 12; frame += 1) {
      await nextFrame();
      const current = snapshot();
      if (current === previous) return;
      previous = current;
    }
    throw new Error("Layout geometry did not stabilize within 12 animation frames");
  }, selector);
};

const assertNoGlobalOverflow = async (page) => {
  const overflow = await page.evaluate(() => ({
    body: document.body.scrollWidth - document.body.clientWidth,
    document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
  if (overflow.body !== 0 || overflow.document !== 0) throw new Error(`Global horizontal overflow detected: body=${overflow.body}, document=${overflow.document}`);
};

export const captureScenarioPage = async ({ adapter = {}, browserContext, page, run, runRoot, scenario, side, viewport }) => {
  const descriptor = run[side];
  const baseUrl = resolveBaseUrl(descriptor, scenario.category);
  if (!baseUrl) throw new Error(`No ${side} base URL for category ${scenario.category}`);

  // Proven source order, preserved by extraction:
  // fixed clock -> navigation -> context/page preparation -> interactions -> observable state -> geometry/overflow -> project assertion -> screenshot.
  const frozenTime = run.capture?.fixedTime;
  if (frozenTime && page.clock?.setFixedTime) await page.clock.setFixedTime(new Date(frozenTime));
  const response = await page.goto(new URL(scenario.route, baseUrl).toString(), { waitUntil: scenario.interactions.length === 0 ? "load" : "networkidle" });
  if (response && typeof response.status === "function" && response.status() >= 400) throw new Error(`${scenario.route} returned ${response.status()}`);
  await adapter.prepareContext?.({ browserContext, page, run, scenario, side, viewport });
  await adapter.preparePage?.({ browserContext, page, run, scenario, side, viewport });
  await executeInteractionSteps({ baseUrl, page, steps: scenario.interactions });
  await waitForObservableState(page, scenario.expected);
  await waitForStableGeometry(page, run.capture?.geometrySelector);
  await assertNoGlobalOverflow(page);
  await adapter.assertPage?.({ browserContext, page, run, scenario, side, viewport });

  const directory = path.join(runRoot, "screenshots", side, "capture", viewport.id);
  await mkdir(directory, { recursive: true });
  const screenshotPath = path.join(directory, `${scenario.id}.png`);
  await page.screenshot({
    animations: run.capture?.animations ?? "disabled",
    caret: run.capture?.caret ?? "initial",
    fullPage: run.capture?.fullPage ?? true,
    path: screenshotPath,
    scale: run.capture?.scale ?? "css",
    type: "png",
  });
  return screenshotPath;
};
