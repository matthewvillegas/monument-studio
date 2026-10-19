/**
 * Capture the real Sprint E workflow against a local production server.
 * npm run build; npm start -- --hostname 127.0.0.1 --port 3000
 * node scripts/record-release-demo.mjs
 *
 * No application state, UI, or export bytes are synthesized. A fresh browser
 * profile keeps the user's actual local saves separate. Sprint C/D artifacts
 * are preserved. Raw capture and timing metadata remain in ignored tmp/pdfs.
 * DEMO_PACE=0.1 is a rehearsal only; the published take uses the default 1.
 */
import assert from "node:assert/strict";
import { copyFile, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";

const root = fileURLToPath(new URL("../", import.meta.url));
const baseURL = new URL(process.env.DEMO_BASE_URL ?? "http://127.0.0.1:3000");
assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(baseURL.hostname));
const pace = Number(process.env.DEMO_PACE ?? "1");
assert.ok(pace > 0 && pace <= 1);
const scratchParent = path.join(root, "tmp", "pdfs");
await mkdir(scratchParent, { recursive: true });
const scratch = await mkdtemp(path.join(scratchParent, "release-demo-"));
for (const dir of ["docs/videos", "docs/images", "output/images", "output/pdf", "output/designs"])
  await mkdir(path.join(root, dir), { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce", acceptDownloads: true,
  recordVideo: { dir: scratch, size: { width: 1440, height: 1000 } },
});
const page = await context.newPage();
const video = page.video();
const errors = [];
const cues = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
page.on("dialog", async (dialog) => { assert.equal(dialog.type(), "beforeunload"); await dialog.accept(); });
const started = performance.now();
const elapsed = () => (performance.now() - started) / 1000;
const button = (name) => page.getByRole("button", { name, exact: true });
async function until(seconds) {
  const remaining = seconds * 1000 * pace - (performance.now() - started);
  if (remaining > 0) await page.waitForTimeout(remaining);
}
function cue(text) { cues.push({ start: elapsed(), text }); console.log(text.replaceAll("\n", " ")); }
async function download(name, target) {
  const pending = page.waitForEvent("download");
  await button(name).click();
  const result = await pending;
  assert.equal(await result.failure(), null);
  const destination = path.join(root, target);
  await result.saveAs(destination);
  return destination;
}
async function snapshot() {
  return {
    path: await page.getByTestId("front-tablet-path").getAttribute("d"),
    text: await page.locator("[data-testid^='inscription-']").evaluateAll((nodes) => nodes.map((node) => ({
      text: node.textContent, x: node.getAttribute("x"), y: node.getAttribute("y"), size: node.getAttribute("font-size"),
    }))),
    area: await page.getByTestId("profile-area-in2").innerText(),
    total: await page.getByTestId("total-volume-in3").innerText(),
  };
}
let completed = false;
let saved;
let designPath;
let duration;
try {
  cue("MonumentStudio | A memorial design workflow\nActual application. Fictional example.");
  await page.goto(baseURL.href);
  await expect(page.getByRole("heading", { name: "MonumentStudio", level: 1 })).toBeVisible();
  await until(4);
  cue("Choose an oval top and adjust dimensions.\nBoth elevations use the same inch-based model.");
  await page.getByLabel("Monument shape", { exact: true }).selectOption("upright-oval");
  await page.waitForTimeout(900 * pace);
  await page.locator("#tablet-height").fill("32");
  await page.waitForTimeout(900 * pace);
  await page.locator("#tablet-thickness").fill("9");
  await until(9);
  cue("Add the family name, dates, and a line of remembrance.\nEvery detail in this demonstration is fictional.");
  await button("02 · Inscription").click();
  for (const [label, value] of [["Name", "NORTH FAMILY"], ["Dates", "1900 — 2000"], ["Epitaph (optional)", "A life remembered"]]) {
    await page.getByLabel(label, { exact: true }).fill("");
    await page.getByLabel(label, { exact: true }).pressSequentially(value, { delay: 65 * pace });
    await page.waitForTimeout(600 * pace);
  }
  await until(19);
  cue("Position the lettering precisely.\nMove the selected line in quarter-inch steps.");
  await button("Position name").click();
  await button("Move up 0.25 inches").click();
  await page.waitForTimeout(1_000 * pace);
  await button("Center horizontally").click();
  await until(25);
  cue("Oversized lettering triggers a real layout warning.\nThe guide is preliminary; final engraving clearance still needs review.");
  const font = page.getByLabel("Font size (in)", { exact: true });
  await font.fill("8");
  await expect(font).toHaveValue("8");
  await page.waitForTimeout(250);
  await font.press("Enter");
  await expect(page.getByTestId("inscription-name")).toHaveAttribute("font-size", "8");
  await expect(page.locator(".layout-warnings")).toBeVisible();
  await page.locator(".layout-warnings").scrollIntoViewIfNeeded();
  await until(31);
  await font.fill("2.5");
  await page.waitForTimeout(250);
  await font.press("Enter");
  await expect(page.getByText("Your text fits within the current layout guide. No overlaps detected.", { exact: true })).toBeVisible();
  await page.getByText("Your text fits within the current layout guide. No overlaps detected.", { exact: true }).scrollIntoViewIfNeeded();
  await until(35);
  cue("Review calculated face area and solid volume.\nThese estimates do not establish weight or manufacturing approval.");
  await button("03 · Design Review").click();
  const before = await snapshot();
  const area = 48 * (32 - 8) + Math.PI * 48 * 8 / 4;
  const total = area * 9 + 60 * 8 * 14;
  assert.ok(Math.abs(Number(before.area.replaceAll(",", "")) - area) < 0.01);
  assert.ok(Math.abs(Number(before.total.replaceAll(",", "")) - total) < 0.01);
  await until(43);
  cue("Save explicitly, refresh, then reopen the saved design.\nThis save belongs to this browser and device.");
  await button("Save Design").click();
  await expect(page.getByText("Design saved on this device.", { exact: true })).toBeVisible();
  saved = await page.evaluate(() => localStorage.getItem("monumentstudio.saved-design.v1"));
  assert.ok(saved);
  await until(46);
  await page.reload();
  await expect(page.locator("#tablet-height")).toHaveValue("30");
  await until(49);
  await button("Open Saved Design").click();
  const confirmation = page.getByRole("dialog", { name: "Replace current design?" });
  await expect(confirmation.getByRole("button", { name: "Keep Current Design" })).toBeFocused();
  await page.waitForTimeout(1_100 * pace);
  await confirmation.getByRole("button", { name: "Replace Current Design" }).click();
  await expect(page.locator("#tablet-height")).toHaveValue("32");
  await button("03 · Design Review").click();
  assert.deepEqual(await snapshot(), before);
  await until(56);
  cue("Download the high-resolution design image.\nThe real PNG contains both elevations at 3840 × 2440 pixels.");
  await page.locator(".output-actions > summary").click();
  const pngPath = await download("Download Design Image", "output/images/sprint-e-design.png");
  const png = await readFile(pngPath);
  assert.equal(png.readUInt32BE(16), 3840); assert.equal(png.readUInt32BE(20), 2440);
  await until(63);
  cue("Generate a PDF summary of the same design.\nIt includes dimensions, lettering, calculations, and limitations.");
  await download("Download Design PDF", "output/pdf/sprint-e-design-summary.pdf");
  await until(69);
  cue("Prepare a preliminary proposal with optional review notes.\nIt is not a quote, contract, or production approval.");
  await button("Create Customer Proposal").click();
  const modal = page.getByRole("dialog", { name: "Create Customer Proposal" });
  await modal.getByLabel("Customer or family reference (optional)").fill("Fictional North family - demonstration only");
  await modal.getByLabel("Proposal title (optional)").fill("A memorial for your consideration");
  await modal.getByLabel("Design description (optional)").fill("Oval-top tablet on a rectangular base. Demonstration stone appearance only.");
  await modal.getByLabel("Consultant notes (optional)").fill("Please review spelling, dates, dimensions, and placement before production. This fictional example is not a production order.");
  await page.waitForTimeout(1_600 * pace);
  await download("Download Customer Proposal", "output/pdf/sprint-e-customer-proposal.pdf");
  await expect(modal.locator(".output-feedback")).toContainText("Customer proposal download started.");
  await until(79);
  cue("One design connects editing, recovery, and documents.\nHuman review remains essential.");
  await button("Close and Clear Details").click();
  await page.locator(".output-actions > summary").click();
  assert.deepEqual(await snapshot(), before);
  assert.equal(await page.evaluate(() => localStorage.getItem("monumentstudio.saved-design.v1")), saved);
  await until(84);
  duration = elapsed();
  completed = true;
} finally {
  await context.close();
}
assert.ok(completed && video);
const raw = await video.path();
await copyFile(raw, path.join(scratch, "sprint-e-raw.webm"));
const capture = { browser: browser.version(), viewport: { width: 1440, height: 1000 }, pace, duration, raw, cues };
await writeFile(path.join(scratch, "capture.json"), JSON.stringify(capture, null, 2));

// Use a second unrecorded context so responsive checks do not extend the film.
const stillContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce", acceptDownloads: true });
const still = await stillContext.newPage();
await still.goto(baseURL.href);
await expect(still.getByRole("heading", { name: "MonumentStudio", level: 1 })).toBeVisible();
// The portable file is the exact browser save already verified above.
designPath = path.join(root, "output/designs/sprint-e-design.json");
await writeFile(designPath, saved);
const chooser = still.waitForEvent("filechooser");
await still.getByRole("button", { name: "Import Design File", exact: true }).click();
await (await chooser).setFiles(designPath);
await still.getByRole("dialog", { name: "Replace current design?" }).getByRole("button", { name: "Replace Current Design" }).click();
await expect(still.locator("#tablet-height")).toHaveValue("32");
for (const viewport of [{ width: 1440, height: 1000 }, { width: 1024, height: 900 }, { width: 390, height: 844 }]) {
  await still.setViewportSize(viewport);
  await still.evaluate(() => window.scrollTo(0, 0));
  await still.waitForTimeout(200);
  assert.ok(await still.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth) <= 1);
  await still.screenshot({ path: path.join(root, `docs/images/sprint-e-designer-${viewport.width}.png`), fullPage: true, animations: "disabled" });
}
await stillContext.close();
await browser.close();
assert.deepEqual(errors, []);
console.log(JSON.stringify({ scratch, duration, browser: capture.browser, errors }));
