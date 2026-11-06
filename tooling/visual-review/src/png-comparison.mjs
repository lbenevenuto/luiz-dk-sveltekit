import { createHash } from "node:crypto";
import { cropRgba, decodeRgbaPng, encodeRgbaPng } from "../vendor/png-rgba-codec.mjs";

export const sha256 = (contents) => createHash("sha256").update(contents).digest("hex");

export const cropPng = (buffer, bounds, padding = 8) => {
  const source = decodeRgbaPng(buffer);
  const minX = Math.max(0, bounds.minX - padding);
  const minY = Math.max(0, bounds.minY - padding);
  const maxX = Math.min(source.width - 1, bounds.maxX + padding);
  const maxY = Math.min(source.height - 1, bounds.maxY + padding);
  const crop = cropRgba(source, minX, minY, maxX - minX + 1, maxY - minY + 1);
  return encodeRgbaPng(crop);
};

export const comparePng = (leftBuffer, rightBuffer) => {
  const left = decodeRgbaPng(leftBuffer);
  const right = decodeRgbaPng(rightBuffer);
  if (left.width !== right.width || left.height !== right.height) {
    return {
      bounds: null,
      dimensions: {
        left: { height: left.height, width: left.width },
        right: { height: right.height, width: right.width },
      },
      differingPixels: null,
      exact: false,
    };
  }

  let differingPixels = 0;
  let maxX = -1;
  let maxY = -1;
  let minX = left.width;
  let minY = left.height;

  for (let pixel = 0; pixel < left.width * left.height; pixel += 1) {
    const index = pixel * 4;
    if (
      left.data[index] === right.data[index] &&
      left.data[index + 1] === right.data[index + 1] &&
      left.data[index + 2] === right.data[index + 2] &&
      left.data[index + 3] === right.data[index + 3]
    ) {
      continue;
    }
    differingPixels += 1;
    const x = pixel % left.width;
    const y = Math.floor(pixel / left.width);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  return {
    bounds: differingPixels === 0 ? null : { maxX, maxY, minX, minY },
    dimensions: { height: left.height, width: left.width },
    differingPixels,
    exact: differingPixels === 0,
  };
};
