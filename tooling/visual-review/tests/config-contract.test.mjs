import assert from "node:assert/strict"; import test from "node:test";
import { defineVisualReviewConfig } from "../src/index.mjs";
import { makeConfig } from "./helpers/fixtures.mjs";

test("canonical config accepts reference/target/category and reduced adapter boundary",()=>{const c=defineVisualReviewConfig({...makeConfig(),projectAdapter:{prepareContext(){},preparePage(){},assertPage(){}}});assert.equal(c.scenarios[0].category,"catalog");assert.equal(c.target.label,"Target App");});
test("legacy surface/production terms are not first-class generic config",()=>{const c=makeConfig();c.scenarios=[{...c.scenarios[0],category:undefined,surface:"legacy"}];assert.throws(()=>defineVisualReviewConfig(c),/unknown category|category/);});
test("runtimeDriver is required and explicit",()=>{const c=makeConfig();delete c.runtimeDriver;assert.throws(()=>defineVisualReviewConfig(c),/runtimeDriver is required/);});
test("unapproved adapter hooks are rejected so they are not accidentally frozen",()=>{assert.throws(()=>defineVisualReviewConfig({...makeConfig(),projectAdapter:{resolveBaseUrl(){return "x";}}}),/not part of the 0.1.0 adapter boundary/);});
