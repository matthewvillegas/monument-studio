/**
 * Record a real, silent production-browser workflow. No screenshots or DOM
 * overlays are synthesized. Start the production app separately, then run:
 *   npm run build
 *   npm run start -- --hostname 127.0.0.1 --port 3131
 *   node scripts/record-demo.mjs
 * Set DEMO_BASE_URL to another loopback address if needed. Raw recordings and
 * the actual downloaded design remain in ignored test-results/demo-* folders.
 */
import assert from "node:assert/strict";
import { copyFile, mkdir, mkdtemp, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";

const root = fileURLToPath(new URL("../", import.meta.url));
const baseURL = new URL(process.env.DEMO_BASE_URL ?? "http://127.0.0.1:3131");
assert.ok(
  ["127.0.0.1", "localhost", "[::1]"].includes(baseURL.hostname),
  "Record only a locally running application.",
);
const artifactParent = path.join(root, "test-results");
await mkdir(artifactParent, { recursive: true });
const artifacts = await mkdtemp(path.join(artifactParent, "demo-"));
const output = path.join(root, "docs", "videos", "sprint-c-workflow.webm");
const browser = await chromium.launch();
console.log(`Recording Chromium ${browser.version()} at ${baseURL.origin}.`);
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
  acceptDownloads: true,
  recordVideo: { dir: artifacts, size: { width: 1440, height: 1000 } },
});
const page = await context.newPage();
const video = page.video();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("dialog", async (dialog) => {
  assert.equal(dialog.type(), "beforeunload");
  await dialog.accept();
});
const started = performance.now();

async function holdUntil(seconds) {
  const remaining = seconds * 1000 - (performance.now() - started);
  if (remaining > 0) await page.waitForTimeout(remaining);
}

async function button(name) {
  await page.getByRole("button", { name, exact: true }).click();
}

async function replaceCurrent() {
  const dialog = page.getByRole("dialog", { name: "Replace current design?" });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Keep Current Design" }),
  ).toBeFocused();
  await page.waitForTimeout(900);
  await dialog.getByRole("button", { name: "Replace Current Design" }).click();
}

async function snapshot() {
  const inscriptions = {};
  for (const id of ["name", "dates", "epitaph"]) {
    inscriptions[id] = await page.getByTestId(`inscription-${id}`).evaluate((node) => ({
      text: node.textContent,
      x: node.getAttribute("x"),
      y: node.getAttribute("y"),
      fontSize: node.getAttribute("font-size"),
      anchor: node.getAttribute("text-anchor"),
    }));
  }
  const quantities = {};
  for (const id of [
    "profile-area-in2", "tablet-volume-in3", "base-volume-in3",
    "total-volume-in3", "total-volume-ft3",
  ]) quantities[id] = await page.getByTestId(id).innerText();
  return {
    inscriptions,
    quantities,
    front: await page.getByTestId("front-tablet-path").getAttribute("d"),
    side: await page.getByTestId("side-tablet").evaluate((node) => ({
      x: node.getAttribute("x"), y: node.getAttribute("y"),
      width: node.getAttribute("width"), height: node.getAttribute("height"),
    })),
  };
}

async function download() {
  const pending = page.waitForEvent("download");
  await button("Download Design File");
  const result = await pending;
  assert.equal(await result.failure(), null);
  return result;
}

let completed = false;
try {
  await page.goto(baseURL.href);
  await expect(page.getByRole("heading", { name: "MonumentStudio", level: 1 })).toBeVisible();
  await holdUntil(4);
  console.log("Choosing oval and editing inch dimensions.");
  await page.getByLabel("Monument shape", { exact: true }).selectOption("upright-oval");
  for (const [id, value] of [
    ["base-width", "64.25"], ["base-height", "9.5"], ["base-depth", "16.25"],
    ["tablet-width", "54.5"], ["tablet-height", "34.25"],
    ["tablet-thickness", "9.25"], ["cap-rise", "11.75"],
  ]) {
    await page.locator(`#${id}`).fill(value);
    await page.waitForTimeout(600);
  }
  await holdUntil(15);
  console.log("Editing and positioning a fictional demonstration inscription.");
  await button("02 · Inscription");
  await page.getByLabel("Name", { exact: true }).fill("NORTH FAMILY");
  await page.waitForTimeout(1_000);
  await page.getByLabel("Dates", { exact: true }).fill("1900 — 2000");
  await page.getByLabel("Epitaph (optional)", { exact: true }).fill("In loving memory");
  await holdUntil(23);
  await button("Position name");
  await page.getByLabel("Font size (in)", { exact: true }).fill("2.75");
  await page.getByLabel("Font size (in)", { exact: true }).press("Enter");
  await button("Move up 0.25 inches");
  await page.waitForTimeout(900);
  await button("Center horizontally");
  await holdUntil(30);
  await button("Expand drawing");
  await page.waitForTimeout(1_500);
  await button("Fit drawing");
  await holdUntil(37);
  await button("Close drawing");
  await button("03 · Design Review");
  const before = await snapshot();
  const area = 54.5 * (34.25 - 11.75) + Math.PI * 54.5 * 11.75 / 4;
  const total = area * 9.25 + 64.25 * 9.5 * 16.25;
  assert.ok(Math.abs(Number(before.quantities["profile-area-in2"].replaceAll(",", "")) - area) < 0.01);
  assert.ok(Math.abs(Number(before.quantities["total-volume-in3"].replaceAll(",", "")) - total) < 0.01);
  await holdUntil(44);
  console.log("Saving, reloading, and restoring the actual browser-local design.");
  await button("Save Design");
  await expect(page.getByText("Design saved on this device.", { exact: true })).toBeVisible();
  const saved = await page.evaluate(() => localStorage.getItem("monumentstudio.saved-design.v1"));
  assert.ok(saved);
  await holdUntil(48);
  await page.reload();
  await expect(page.locator("#tablet-width")).toHaveValue("48");
  await page.waitForTimeout(1_000);
  await button("Open Saved Design");
  await replaceCurrent();
  await expect(page.getByText("Your design has been restored.", { exact: true })).toBeVisible();
  await expect(page.locator("#tablet-width")).toHaveValue("54.5");
  await button("03 · Design Review");
  assert.deepEqual(await snapshot(), before);
  await holdUntil(56);
  console.log("Downloading a real file, changing the design, and importing that file.");
  const exported = await download();
  const designPath = path.join(artifacts, "monumentstudio-design.json");
  await exported.saveAs(designPath);
  assert.equal(await readFile(designPath, "utf8"), saved);
  await page.waitForTimeout(1_500);
  await button("02 · Inscription");
  await page.getByLabel("Name", { exact: true }).fill("TEMPORARY EDIT");
  await holdUntil(62);
  const chooserPending = page.waitForEvent("filechooser");
  await button("Import Design File");
  await (await chooserPending).setFiles(designPath);
  await replaceCurrent();
  await expect(page.getByText(
    "Design file imported. Choose Save Design to keep it on this device.",
    { exact: true },
  )).toBeVisible();
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue("NORTH FAMILY");
  await button("03 · Design Review");
  assert.deepEqual(await snapshot(), before);
  const roundTrip = await download();
  assert.deepEqual(JSON.parse(await readFile(await roundTrip.path(), "utf8")), JSON.parse(saved));
  assert.deepEqual(errors, []);
  await holdUntil(75);
  completed = true;
} finally {
  await context.close();
  await browser.close();
}

if (completed) {
  assert.ok(video);
  await mkdir(path.dirname(output), { recursive: true });
  // Publish the capture only after every real workflow assertion succeeds.
  await copyFile(await video.path(), output);
  console.log(`Verified silent recording: ${output}`);
  console.log(`Raw video and downloaded JSON: ${artifacts}`);
}
