import assert from "node:assert/strict"; import test from "node:test"; import * as api from "../src/index.mjs";
test("public API stays intentionally small",()=>{assert.deepEqual(Object.keys(api).sort(),["captureRun","compareRun","createRun","defineVisualReviewConfig","generateReport","validateRun"].sort());});
