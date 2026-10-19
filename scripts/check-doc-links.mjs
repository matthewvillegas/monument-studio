#!/usr/bin/env node
// Dependency-free checks for the Markdown in the proposed Git publication set.
// External URLs are deliberately not fetched; this is a local integrity check.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = execFileSync("git", ["rev-parse", "--show-toplevel"], {
  encoding: "utf8",
}).trim();
const candidates = new Set(
  execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { cwd: root, encoding: "utf8" },
  )
    .split("\0")
    .filter(Boolean),
);
const markdownFiles = [...candidates].filter(
  (file) => /\.(?:md|markdown)$/i.test(file) && existsSync(path.join(root, file)),
);
const failures = [];
const anchorCache = new Map();
let localLinks = 0;
let headingLinks = 0;

function withoutFences(source) {
  let fence;
  return source
    .split(/\r?\n/)
    .map((line) => {
      const marker = /^\s{0,3}(`{3,}|~{3,})/.exec(line)?.[1];
      if (fence) {
        if (
          marker?.[0] === fence[0] &&
          marker.length >= fence.length &&
          /^\s{0,3}(?:`+|~+)\s*$/.test(line)
        ) {
          fence = undefined;
        }
        return "";
      }
      if (marker) {
        fence = marker;
        return "";
      }
      return line;
    });
}

function unescapeMarkdown(value) {
  return value.replace(/\\([!"#$%&'()*+,\-./:;<=>?@[\]\\^_`{|}~])/g, "$1");
}

function headingAnchors(file) {
  if (anchorCache.has(file)) return anchorCache.get(file);
  const anchors = new Set();
  const lines = withoutFences(readFileSync(file, "utf8"));
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    for (const match of line.matchAll(/\b(?:id|name)=["']([^"']+)["']/g)) {
      anchors.add(match[1]);
    }
    const atx = /^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/.exec(line);
    const setext = line.trim() && /^\s{0,3}(?:=+|-+)\s*$/.test(lines[index + 1] ?? "");
    if (!atx && !setext) continue;
    const title = unescapeMarkdown(atx?.[1] ?? line.trim())
      .replace(/<[^>]*>/g, "")
      .replace(/!?\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    const base = title
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, "")
      .replace(/\s/g, "-");
    let slug = base;
    let suffix = 0;
    while (anchors.has(slug)) slug = `${base}-${++suffix}`;
    anchors.add(slug);
  }
  anchorCache.set(file, anchors);
  return anchors;
}

function checkDestination(file, lineNumber, rawDestination) {
  const destination = unescapeMarkdown(rawDestination);
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(destination)) return;
  localLinks += 1;
  const fail = (message) => failures.push(`${file}:${lineNumber}: ${message}`);
  const hashIndex = destination.indexOf("#");
  let linkPath = hashIndex < 0 ? destination : destination.slice(0, hashIndex);
  let fragment = hashIndex < 0 ? "" : destination.slice(hashIndex + 1);
  linkPath = linkPath.split("?")[0];
  try {
    linkPath = decodeURIComponent(linkPath);
    fragment = decodeURIComponent(fragment);
  } catch {
    fail(`invalid URL encoding: ${destination}`);
    return;
  }
  const resolved = !linkPath
    ? path.join(root, file)
    : linkPath.startsWith("/")
      ? path.resolve(root, `.${linkPath}`)
      : path.resolve(path.dirname(path.join(root, file)), linkPath);
  if (!existsSync(resolved)) {
    fail(`missing target: ${destination}`);
    return;
  }
  const targetIsFile = statSync(resolved).isFile();
  const candidatePath = path.relative(root, resolved).split(path.sep).join("/");
  if (targetIsFile && !candidates.has(candidatePath)) {
    fail(`target excluded from Git publication candidates: ${destination}`);
    return;
  }
  if (fragment && /\.(?:md|markdown)$/i.test(resolved) && targetIsFile) {
    headingLinks += 1;
    if (!headingAnchors(resolved).has(fragment)) {
      fail(`missing heading anchor: ${destination}`);
    }
  }
}

// Read a Markdown destination, including balanced parentheses and <space paths>.
function readDestination(text, start) {
  let index = start;
  while (/\s/.test(text[index] ?? "") && index < text.length) index += 1;
  if (text[index] === "<") {
    const end = text.indexOf(">", index + 1);
    return end < 0 ? undefined : text.slice(index + 1, end);
  }
  const begin = index;
  let depth = 0;
  for (; index < text.length; index += 1) {
    if (text[index] === "\\") {
      index += 1;
      continue;
    }
    if (text[index] === "(") depth += 1;
    if (text[index] === ")") {
      if (depth === 0) break;
      depth -= 1;
    }
    if (/\s/.test(text[index]) && depth === 0) break;
  }
  return text.slice(begin, index);
}

for (const file of markdownFiles) {
  const lines = withoutFences(readFileSync(path.join(root, file), "utf8"));
  for (const [index, original] of lines.entries()) {
    const definition = /^\s{0,3}\[[^\]]+\]:\s*(.*)$/.exec(original);
    if (definition) {
      const destination = readDestination(definition[1] || lines[index + 1] || "", 0);
      if (destination) checkDestination(file, index + 1, destination);
      continue;
    }
    const line = original.replace(/(`+).*?\1/g, "");
    for (const match of line.matchAll(/(?<!\\)\]\(/g)) {
      const destination = readDestination(line, match.index + 2);
      if (destination !== undefined) checkDestination(file, index + 1, destination);
    }
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`Documentation links: ${failures.length} failure(s); ${markdownFiles.length} Markdown files, ${localLinks} local targets, ${headingLinks} heading anchors checked.`);
  process.exitCode = 1;
} else {
  console.log(`Documentation links passed: ${markdownFiles.length} Markdown files, ${localLinks} local targets, ${headingLinks} heading anchors checked.`);
}
