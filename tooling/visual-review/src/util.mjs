import { createHash } from "node:crypto";
import { access, lstat, readFile } from "node:fs/promises";
import path from "node:path";

export const assert = (condition, message) => {
  if (!condition) throw new Error(`Visual-review error: ${message}`);
};

export const stableStringify = (value) => {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
};

export const sha256Text = (value) => createHash("sha256").update(value).digest("hex");
export const sha256Json = (value) => sha256Text(stableStringify(value));

export const safeIdentifier = (value, label) => {
  assert(typeof value === "string" && /^[a-zA-Z0-9._-]+$/.test(value) && value !== "." && value !== "..", `${label} contains unsafe characters`);
  return value;
};

export const assertRelativePortablePath = (value, label) => {
  assert(typeof value === "string" && value.length > 0, `${label} is required`);
  assert(!path.isAbsolute(value), `${label} must be relative`);
  const normalized = path.posix.normalize(value.replaceAll("\\", "/"));
  assert(normalized !== ".." && !normalized.startsWith("../"), `${label} must not escape its root`);
  return normalized;
};

export const resolveContained = (root, relative, label = "path") => {
  const safe = assertRelativePortablePath(relative, label);
  const absoluteRoot = path.resolve(root);
  const absolute = path.resolve(absoluteRoot, safe);
  assert(absolute === absoluteRoot || absolute.startsWith(`${absoluteRoot}${path.sep}`), `${label} escapes root`);
  return { absolute, relative: safe };
};

export const exists = async (file) => {
  try { await access(file); return true; } catch (error) { if (error.code === "ENOENT") return false; throw error; }
};

export const readJson = async (file) => JSON.parse(await readFile(file, "utf8"));

export const assertNoSymlink = async (file, label = "path") => {
  const info = await lstat(file);
  assert(!info.isSymbolicLink(), `${label} must not be a symbolic link`);
};

export const assertNoSymlinkAncestors = async (root, relative, label = "path") => {
  const safe = assertRelativePortablePath(relative, label);
  const parts = safe.split("/").filter(Boolean);
  let current = path.resolve(root);
  for (const part of parts.slice(0, -1)) {
    current = path.join(current, part);
    try {
      const info = await lstat(current);
      assert(!info.isSymbolicLink(), `${label} traverses symbolic link ${current}`);
    } catch (error) {
      if (error.code === "ENOENT") break;
      throw error;
    }
  }
};
