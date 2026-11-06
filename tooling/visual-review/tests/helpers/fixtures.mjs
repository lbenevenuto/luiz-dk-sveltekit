import { writeFile } from "node:fs/promises";
import { encodeRgbaPng } from "../../vendor/png-rgba-codec.mjs";

export const makePng = ({ width = 3, height = 3, pixel = [10, 20, 30, 255], changes = [] } = {}) => {
  const data = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    const p=i*4; data[p]=pixel[0]; data[p+1]=pixel[1]; data[p+2]=pixel[2]; data[p+3]=pixel[3];
  }
  for (const { x, y, rgba } of changes) {
    const p=(y*width+x)*4; data[p]=rgba[0]; data[p+1]=rgba[1]; data[p+2]=rgba[2]; data[p+3]=rgba[3];
  }
  return encodeRgbaPng({ width, height, data });
};

export const fakeRuntimeDriver = ({ imageFactory = () => makePng(), failCapture = false } = {}) => ({
  identity: { name: "test-runtime", version: "1.0.0", browser: "synthetic" },
  async prepare() {},
  async collectEvidence() { return { browser: "synthetic", deterministic: true }; },
  async capture({ side, run, captureScenario }) {
    if (failCapture) throw new Error("synthetic capture failure");
    for (const scenario of run.scenarios) {
      for (const viewport of run.viewports.filter(({ id }) => !scenario.viewports || scenario.viewports.includes(id))) {
        const locator={ click:async()=>{}, fill:async()=>{}, pressSequentially:async()=>{}, selectOption:async()=>{}, waitFor:async()=>{}, filter(){return this;}, nth(){return this;}, first(){return this;} };
        const page={
          clock:{ setFixedTime:async()=>{} },
          goto:async()=>({status:()=>200}),
          getByRole:()=>locator, getByPlaceholder:()=>locator, getByLabel:()=>locator, getByText:()=>locator,
          evaluate:async(_fn,arg)=> arg!==undefined ? undefined : ({body:0,document:0}),
          screenshot:async({path})=>{await writeFile(path,imageFactory({side,scenario,viewport}));},
        };
        await captureScenario({ browserContext:{}, page, scenario, viewport });
      }
    }
  },
  async cleanup() {},
});

export const makeConfig = ({ targetRevision = "target-rev-001", referenceRevision = "reference-rev-001", runtimeDriver = fakeRuntimeDriver(), scenarios, viewports } = {}) => ({
  schemaVersion: "1.0.0",
  project: { id: "neutral-fixture", labels: { category: "Area", reference: "Reference", target: "Target" } },
  reference: { id: "reference-app", label: "Reference App", version: "1.0.0", immutableRevision: referenceRevision, sourceKind: "local-executable", baseUrls: { catalog: "http://reference.local" } },
  target: { id: "target-app", label: "Target App", immutableRevision: targetRevision, sourceKind: "local-executable", baseUrls: { catalog: "http://target.local" } },
  categories: [{ id: "catalog", label: "Catalog" }],
  evidence: { root: ".evidence", scopeSegment: "scopes", runsSegment: "runs", retention: "immutable" },
  capture: { fixedTime: "2026-09-22T12:00:00Z", geometrySelector: "main", fullPage: true, animations: "disabled", caret: "initial", scale: "css" },
  comparison: { cropPadding: 8, regionRules: [] },
  viewports: viewports ?? [{ id: "desktop", label: "Desktop", width: 1200, height: 800, deviceScaleFactor: 1 }],
  scenarios: scenarios ?? [{ id: "home", name: "Home", category: "catalog", route: "/home", state: "home-visible", context: "default", expected: { text: "Home" }, interactions: [], viewports: ["desktop"] }],
  runtimeDriver,
});
