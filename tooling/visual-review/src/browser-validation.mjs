export const validateRenderedReportPage = async ({ page, manifest }) => {
  const pairs = page.locator(".pair");
  if ((await pairs.count()) !== manifest.pairs.length) throw new Error("Rendered pair count does not match manifest");
  const visibleCount = () => page.locator(".pair:visible").count();
  const assertFilter = async (filter, value, expected) => {
    await page.locator(`#${filter}`).selectOption(value);
    const actual = await visibleCount();
    if (actual !== expected) throw new Error(`${filter}=${value} rendered ${actual}; expected ${expected}`);
    await page.locator(`#${filter}`).selectOption("all");
  };
  const firstCategory = manifest.pairs[0]?.category;
  const firstViewport = manifest.pairs[0]?.viewport.id;
  if (firstCategory) await assertFilter("category", firstCategory, manifest.pairs.filter(({ category }) => category === firstCategory).length);
  if (firstViewport) await assertFilter("viewport", firstViewport, manifest.pairs.filter(({ viewport }) => viewport.id === firstViewport).length);
  await assertFilter("diff", "different", manifest.pairs.filter(({ exact }) => !exact).length);
  await assertFilter("diff", "exact", manifest.pairs.filter(({ exact }) => exact).length);
  await assertFilter("review", "pending-review", manifest.pairs.filter(({ humanReview }) => humanReview.status === "pending-review").length);
  const imageSources = await page.locator("img").evaluateAll((images) => images.map((image) => ({ complete: image.complete, protocol: new globalThis.URL(image.src).protocol })));
  if (imageSources.some(({ complete }) => !complete)) throw new Error("Report contains an incomplete image");
  if (imageSources.some(({ protocol }) => !["file:", "http:", "https:"].includes(protocol))) throw new Error("Report contains an unsupported image protocol");
  return { valid: true, pairs: manifest.pairs.length };
};
