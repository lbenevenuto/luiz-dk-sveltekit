import assert from "node:assert/strict"; import test from "node:test"; import { assertRelativePortablePath, resolveContained } from "../src/util.mjs";
test("path traversal and absolute paths are rejected",()=>{assert.throws(()=>assertRelativePortablePath("../secret","asset"),/escape/);assert.throws(()=>assertRelativePortablePath("/tmp/x","asset"),/relative/);assert.throws(()=>resolveContained("/repo","a/../../x","asset"),/escape/);assert.equal(assertRelativePortablePath("screenshots/reference/a.png","asset"),"screenshots/reference/a.png");});

import { mkdtemp, mkdir, rm, symlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRun } from "../src/index.mjs";
import { makeConfig } from "./helpers/fixtures.mjs";

test("run creation rejects evidence paths traversing an existing symlink", async()=>{const root=await mkdtemp(path.join(os.tmpdir(),"vr-link-"));const outside=await mkdtemp(path.join(os.tmpdir(),"vr-out-"));try{await mkdir(path.join(root,".evidence"),{recursive:true});await symlink(outside,path.join(root,".evidence","scopes"));await assert.rejects(()=>createRun({config:makeConfig(),repositoryRoot:root,runId:"r",scope:"gate"}),/symbolic link/);}finally{await rm(root,{recursive:true,force:true});await rm(outside,{recursive:true,force:true});}});
