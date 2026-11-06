import assert from "node:assert/strict";
import test from "node:test";
import { decodeRgbaPng } from "../vendor/png-rgba-codec.mjs";
import { comparePng, cropPng, sha256 } from "../src/png-comparison.mjs";
import { makePng } from "./helpers/fixtures.mjs";

test("PNG exact comparison preserves proven RGBA behavior", () => {
  const a=makePng(); const b=makePng(); const result=comparePng(a,b);
  assert.equal(result.exact,true); assert.equal(result.differingPixels,0); assert.equal(result.bounds,null); assert.equal(sha256(a),sha256(b));
});

test("PNG comparison detects RGBA and alpha differences with minimal bounds", () => {
  const a=makePng(); const b=makePng({changes:[{x:1,y:2,rgba:[10,20,30,254]}]}); const result=comparePng(a,b);
  assert.equal(result.exact,false); assert.equal(result.differingPixels,1); assert.deepEqual(result.bounds,{minX:1,minY:2,maxX:1,maxY:2});
});

test("PNG dimensions and edge crops are correct", () => {
  const a=makePng({width:3,height:3,changes:[{x:0,y:0,rgba:[255,0,0,255]}]});
  const b=makePng({width:4,height:3});
  const mismatch=comparePng(a,b); assert.equal(mismatch.exact,false); assert.equal(mismatch.differingPixels,null); assert.deepEqual(mismatch.dimensions.left,{width:3,height:3});
  const crop=cropPng(a,{minX:0,minY:0,maxX:0,maxY:0},0); const decoded=decodeRgbaPng(crop); assert.equal(decoded.width,1); assert.equal(decoded.height,1); assert.deepEqual([...decoded.data.subarray(0,4)],[255,0,0,255]);
});

test("malformed PNG is rejected", () => assert.throws(()=>comparePng(Buffer.from("bad"),Buffer.from("bad")),/PNG|signature/i));
