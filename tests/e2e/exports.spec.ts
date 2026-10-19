import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const savedKey = "monumentstudio.saved-design.v1";
const runtimeErrors = new WeakMap<Page, string[]>();

async function tabTo(page: Page, target: Locator) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const key = await target.evaluate((element) => {
      const active = document.activeElement;
      if (active === element) return null;
      return active && (active.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_PRECEDING)
        ? "Shift+Tab" : "Tab";
    });
    if (!key) return;
    await page.keyboard.press(key);
  }
  await expect(target, "Control must be reachable with Tab or Shift+Tab").toBeFocused();
}

async function openOutputs(page: Page) {
  const summary = page.locator(".output-actions > summary");
  if (!(await page.locator(".output-actions").getAttribute("open"))) {
    // The boolean attribute is an empty string when open: test presence instead.
    if (!(await page.locator(".output-actions").evaluate((element) => element.hasAttribute("open")))) {
      await summary.click();
    }
  }
}

async function download(page: Page, button: string, filename: string, keyboard = false) {
  const pending = page.waitForEvent("download");
  const target = page.getByRole("button", { name: button, exact: true });
  if (keyboard) {
    await tabTo(page, target);
    await page.keyboard.press("Enter");
  } else await target.click();
  const result = await pending;
  expect(result.suggestedFilename()).toBe(filename);
  expect(await result.failure()).toBeNull();
  const file = await result.path();
  expect(file).not.toBeNull();
  const bytes = await readFile(file!);
  await test.info().attach(filename, { body: bytes });
  return { bytes, result };
}

async function designFile(page: Page) {
  return (await download(page, "Download Design File", "monumentstudio-design.json")).bytes.toString("utf8");
}

async function drawingGeometry(page: Page) {
  return {
    front: await page.getByTestId("front-tablet-path").getAttribute("d"),
    side: await page.getByTestId("side-tablet").evaluate((element) =>
      Object.fromEntries(["x", "y", "width", "height"].map((name) => [name, element.getAttribute(name)]))),
    inscriptions: await page.locator("[data-testid^='inscription-']").evaluateAll((elements) =>
      elements.map((element) => ({
        text: element.textContent,
        attributes: Object.fromEntries(["data-testid", "x", "y", "font-size", "text-anchor"].map((name) => [name, element.getAttribute(name)])),
      }))),
  };
}

async function editDesign(page: Page, profile: "upright-straight" | "upright-oval") {
  await page.getByRole("button", { name: "01 · Monument" }).click();
  await page.getByLabel("Monument shape", { exact: true }).selectOption(profile);
  for (const [id, value] of [
    ["base-width", "64.25"], ["base-height", "9.5"], ["base-depth", "16.25"],
    ["tablet-width", "54.5"], ["tablet-height", "34.25"], ["tablet-thickness", "9.25"],
  ]) await page.locator(`#${id}`).fill(value!);
  if (profile === "upright-oval") await page.locator("#cap-rise").fill("11.75");
  await page.getByRole("button", { name: "02 · Inscription" }).click();
  await page.getByLabel("Name", { exact: true }).fill("NORTH FAMILY");
  await page.getByLabel("Dates", { exact: true }).fill("1900 — 2000");
  await page.getByLabel("Epitaph (optional)", { exact: true }).fill("A life remembered");
  await page.getByRole("button", { name: "Position name", exact: true }).click();
  const fineTune = page.getByText("Fine-tune position", { exact: true });
  if (!(await fineTune.locator("..").evaluate((element) => element.hasAttribute("open")))) await fineTune.click();
  await page.getByLabel("Y baseline (in)", { exact: true }).fill("12");
  await page.getByLabel("Y baseline (in)", { exact: true }).press("Enter");
  await page.getByLabel("Font size (in)", { exact: true }).fill("2.75");
  await page.getByLabel("Font size (in)", { exact: true }).press("Enter");
  await page.getByRole("button", { name: "Move up 0.25 inches" }).click();
  await page.getByRole("button", { name: "Center horizontally" }).click();
}

async function readPdf(bytes: Buffer) {
  expect(bytes.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  const { getDocument, OPS } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loading = getDocument({ data: new Uint8Array(bytes), useSystemFonts: false });
  const document = await loading.promise;
  const pages: { width: number; height: number; text: string; images: number }[] = [];
  for (let index = 1; index <= document.numPages; index += 1) {
    const page = await document.getPage(index);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const words: string[] = [];
    for (const item of content.items) {
      if (!("str" in item) || !item.str.trim()) continue;
      words.push(item.str);
      // Independent reader verifies text stays within each page, including
      // long-token wrapping and continuation pages. It is not a visual audit.
      expect(item.transform[4], `Page ${index}: left edge of ${item.str}`).toBeGreaterThanOrEqual(20);
      expect(item.transform[4] + item.width, `Page ${index}: right edge of ${item.str}`).toBeLessThanOrEqual(viewport.width - 20);
      expect(item.transform[5], `Page ${index}: bottom edge of ${item.str}`).toBeGreaterThanOrEqual(16);
      expect(item.transform[5], `Page ${index}: top edge of ${item.str}`).toBeLessThanOrEqual(viewport.height - 16);
    }
    const operations = await page.getOperatorList();
    pages.push({
      width: viewport.width, height: viewport.height, text: words.join(" "),
      images: operations.fnArray.filter((operation) => operation === OPS.paintImageXObject).length,
    });
  }
  await loading.destroy();
  return { pages, text: pages.map((page) => page.text).join(" ") };
}

async function inspectPng(page: Page, bytes: Buffer) {
  expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(bytes.readUInt32BE(16)).toBe(3840);
  expect(bytes.readUInt32BE(20)).toBe(2440);
  return page.evaluate(async (base64) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d")!;
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let opaque = 0; let frontInk = 0; let sideInk = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index + 3] === 255) opaque += 1;
      if (pixels[index]! < 160 && pixels[index + 1]! < 160 && pixels[index + 2]! < 160) {
        const x = (index / 4) % canvas.width;
        if (x < 2800) frontInk += 1; else sideInk += 1;
      }
    }
    return { width: canvas.width, height: canvas.height, opaque, frontInk, sideInk };
  }, bytes.toString("base64"));
}

function quantity(value: number) {
  return value.toFixed(6).replace(/\.?0+$/u, "");
}

function expectSummary(text: string, oval: boolean) {
  expect(text).toContain("Villegas Headstones & Monuments LLC");
  expect(text).toContain(oval ? "Oval-top upright" : "Straight-top upright");
  for (const value of ["54.5 in", "34.25 in", "9.25 in", "64.25 in", "9.5 in", "16.25 in"])
    expect(text).toContain(value);
  if (oval) expect(text).toContain("11.75 in");
  expect(text).toContain("NORTH FAMILY");
  expect(text).toContain("1900 — 2000");
  expect(text).toContain("A life remembered");
  expect(text).toContain("Center X 27.25 in | Baseline Y 11.75 in | Font size 2.75 in");
  // Reference equations are deliberately independent of application functions.
  const area = oval ? 54.5 * (34.25 - 11.75) + Math.PI * 54.5 * 11.75 / 4 : 54.5 * 34.25;
  const tablet = area * 9.25;
  const base = 64.25 * 9.5 * 16.25;
  for (const value of [area, tablet, base, tablet + base, (tablet + base) / 1728])
    expect(text).toContain(quantity(value));
  expect(text).toContain("Not an approved manufacturing or installation specification.");
  expect(text).toContain("Volume is not weight");
  expect(text).toContain("not a calibrated full-size production drawing");
}

async function audit(page: Page, name: string) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  await test.info().attach(`axe-output-${name}`, {
    body: JSON.stringify({ violations: result.violations, incomplete: result.incomplete }), contentType: "application/json",
  });
  expect(result.violations).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  runtimeErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("dialog", async (dialog) => {
    expect(dialog.type()).toBe("beforeunload"); await dialog.accept();
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "MonumentStudio", level: 1 })).toBeVisible();
});

test.afterEach(async ({ page }) => {
  expect(runtimeErrors.get(page)).toEqual([]);
});

test("downloads decodable full-resolution drawings and independently readable PDFs for both profiles", async ({ page }, info) => {
  for (const profile of ["upright-straight", "upright-oval"] as const) {
    await editDesign(page, profile);
    const original = await designFile(page);
    await openOutputs(page);
    const png = await download(page, "Download Design Image", "monumentstudio-design.png");
    const pixels = await inspectPng(page, png.bytes);
    expect(pixels.opaque).toBe(3840 * 2440);
    expect(pixels.frontInk).toBeGreaterThan(50_000);
    expect(pixels.sideInk).toBeGreaterThan(10_000);
    const pdf = await download(page, "Download Design PDF", "monumentstudio-design-summary.pdf");
    const parsed = await readPdf(pdf.bytes);
    expect(parsed.pages[0]).toMatchObject({ width: 792, height: 612, images: 1 });
    expect(parsed.pages.slice(1).every((page) => page.width === 612 && page.height === 792)).toBe(true);
    expectSummary(parsed.text, profile === "upright-oval");
    expect(await designFile(page)).toBe(original);
    if (profile === "upright-oval" && process.env.CAPTURE_D_EXPORTS === "1" && info.project.name === "chromium") {
      await mkdir("output/pdf", { recursive: true }); await mkdir("output/images", { recursive: true });
      await png.result.saveAs("output/images/design.png");
      await pdf.result.saveAs("output/pdf/design-summary.pdf");
    }
    if (profile === "upright-oval") {
      const geometry = await drawingGeometry(page);
      await page.getByRole("button", { name: "Save Design", exact: true }).click();
      await expect(page.getByText("Design saved on this device.", { exact: true })).toBeVisible();
      expect(await page.evaluate((key) => localStorage.getItem(key), savedKey)).toBe(original);

      await page.reload();
      // Restoration is an explicit action; the default is not the saved design.
      await expect(page.locator("#tablet-width")).toHaveValue("48");
      await page.getByRole("button", { name: "Open Saved Design", exact: true }).click();
      const confirmation = page.getByRole("dialog", { name: "Replace current design?" });
      await expect(confirmation.getByRole("button", { name: "Keep Current Design" })).toBeFocused();
      await confirmation.getByRole("button", { name: "Replace Current Design" }).click();
      await expect(confirmation).not.toBeVisible();
      await expect(page.getByText("Your design has been restored.", { exact: true })).toBeVisible();
      expect(await designFile(page)).toBe(original);
      expect(await drawingGeometry(page)).toEqual(geometry);

      await openOutputs(page);
      const restoredPng = await download(page, "Download Design Image", "monumentstudio-design.png");
      expect(restoredPng.bytes.equals(png.bytes)).toBe(true);
      const restoredPdf = await download(page, "Download Design PDF", "monumentstudio-design-summary.pdf");
      const restoredSummary = await readPdf(restoredPdf.bytes);
      expectSummary(restoredSummary.text, true);
      // Each PDF legitimately has a fresh preparation time. Compare every page's
      // dimensions, image count and complete text while excluding only that date.
      const withoutPreparationTime = (pages: typeof parsed.pages) => pages.map((item) => ({
        ...item,
        text: item.text.replace(/Prepared \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} UTC \(device clock\)/gu, "Prepared (device clock)"),
      }));
      expect(withoutPreparationTime(restoredSummary.pages)).toEqual(withoutPreparationTime(parsed.pages));
      expect(await designFile(page)).toBe(original);
      expect(await page.evaluate((key) => localStorage.getItem(key), savedKey)).toBe(original);
    }
  }
});

test("proposal pagination preserves complete fictional details without persisting them or inventing a price", async ({ page }, info) => {
  await editDesign(page, "upright-oval");
  await page.getByRole("button", { name: "Save Design", exact: true }).click();
  const original = await designFile(page);
  const originalStorage = await page.evaluate(() => ({ ...localStorage }));
  await openOutputs(page);
  await page.getByRole("button", { name: "Create Customer Proposal", exact: true }).click();
  const modal = page.getByRole("dialog", { name: "Create Customer Proposal" });
  const notes = Array.from({ length: 24 }, (_, index) => `Review item ${index + 1}: confirm the preliminary inscription and dimensions with the family before production.`).join("\n") + "\nFINAL NOTE: No manufacturing approval is implied.";
  const longToken = "REFERENCE".repeat(15);
  await modal.getByLabel("Customer or family reference (optional)").fill("Fictional North family — demonstration only");
  await modal.getByLabel("Proposal title (optional)").fill("A memorial for your consideration");
  await modal.getByLabel("Project reference (optional)").fill("DEMO-NORTH-014");
  await modal.getByLabel("Design description (optional)").fill(`Oval-top tablet with a rectangular base. ${longToken}`);
  await modal.getByLabel("Consultant notes (optional)").fill(notes);
  const file = await download(page, "Download Customer Proposal", "monumentstudio-customer-proposal.pdf");
  const pdf = await readPdf(file.bytes);
  expect(pdf.pages[0]).toMatchObject({ width: 612, height: 792 });
  expect(pdf.pages.filter((page) => page.images === 1)).toHaveLength(1);
  expect(pdf.pages.find((page) => page.images === 1)).toMatchObject({ width: 792, height: 612 });
  expect(pdf.pages.length).toBeGreaterThanOrEqual(4);
  expect(pdf.text).toContain("Fictional North family — demonstration only");
  expect(pdf.text).toContain("A memorial for your consideration");
  expect(pdf.text).toContain("DEMO-NORTH-014");
  expect(pdf.text.replaceAll(" ", "")).toContain(longToken);
  for (const line of notes.split("\n")) expect(pdf.text).toContain(line);
  expect(pdf.text).toContain("Pricing to be confirmed following design review.");
  expect(pdf.text).toContain("not a binding contract");
  expect(pdf.text).not.toMatch(/[$€£]\s*\d/u);
  expectSummary(pdf.text, true);
  if (process.env.CAPTURE_D_EXPORTS === "1" && info.project.name === "chromium") {
    await mkdir("output/pdf", { recursive: true });
    // Keep the pagination stress file in test evidence. The public sample is
    // a separate, genuinely generated, concise fictional consultation.
    await modal.getByLabel("Design description (optional)").fill("An oval-top tablet on a rectangular base, with a centered family name and understated memorial wording. Demonstration stone appearance only.");
    await modal.getByLabel("Consultant notes (optional)").fill("Please review the spelling, dates, measurements and text placement together. Material availability, engraving details and applicable cemetery requirements still need confirmation. This fictional example is not a production order.");
    const sample = await download(page, "Download Customer Proposal", "monumentstudio-customer-proposal.pdf");
    const samplePdf = await readPdf(sample.bytes);
    expectSummary(samplePdf.text, true);
    expect(samplePdf.text).toContain("This fictional example is not a production order.");
    await sample.result.saveAs("output/pdf/customer-proposal.pdf");
  }
  await page.keyboard.press("Escape");
  expect(await designFile(page)).toBe(original);
  expect(await page.evaluate(() => ({ ...localStorage }))).toEqual(originalStorage);
  await page.getByRole("button", { name: "Create Customer Proposal", exact: true }).click();
  for (const field of await modal.locator("input, textarea").all()) await expect(field).toHaveValue("");
});

test("keyboard-only output and proposal controls restore focus and clear details on Escape or explicit close", async ({ page }) => {
  await tabTo(page, page.locator(".output-actions > summary"));
  await page.keyboard.press("Enter");
  await download(page, "Download Design PDF", "monumentstudio-design-summary.pdf", true);
  const opener = page.getByRole("button", { name: "Create Customer Proposal", exact: true });
  await tabTo(page, opener); await page.keyboard.press("Enter");
  const modal = page.getByRole("dialog", { name: "Create Customer Proposal" });
  const first = modal.getByLabel("Customer or family reference (optional)");
  const last = modal.getByRole("button", { name: "Download Customer Proposal" });
  await expect(first).toBeFocused();
  await page.keyboard.insertText("Temporary family reference");
  await page.keyboard.press("Shift+Tab"); await expect(last).toBeFocused();
  await page.keyboard.press("Tab"); await expect(first).toBeFocused();
  await page.keyboard.press("Escape"); await expect(modal).not.toBeVisible();
  await expect(opener).toBeFocused();
  await page.keyboard.press("Enter"); await expect(first).toHaveValue("");
  await page.keyboard.insertText("Another private draft");
  await tabTo(page, modal.getByRole("button", { name: "Close and Clear Details" }));
  await page.keyboard.press("Enter"); await expect(opener).toBeFocused();
  await page.keyboard.press("Enter"); await expect(first).toHaveValue("");
});

test("invalid drafts and outside-face inscriptions cannot silently produce a misleading output", async ({ page }) => {
  const original = await designFile(page);
  const downloads: string[] = []; page.on("download", (item) => downloads.push(item.suggestedFilename()));
  await openOutputs(page); await page.locator("#tablet-width").fill("121");
  for (const name of ["Download Design Image", "Download Design PDF", "Create Customer Proposal"]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(page.locator(".output-feedback").filter({ visible: true })).toContainText("Apply or correct unfinished measurements");
    await expect(page.getByRole("dialog")).not.toBeVisible();
  }
  await page.locator("#tablet-width").fill("48");
  expect(await designFile(page)).toBe(original);
  downloads.length = 0;
  await page.getByRole("button", { name: "02 · Inscription" }).click();
  await page.getByLabel("Font size (in)", { exact: true }).fill("0.1");
  await page.getByLabel("Font size (in)", { exact: true }).press("Enter");
  await page.getByRole("button", { name: "Download Design Image", exact: true }).click();
  await expect(page.locator(".output-feedback").filter({ visible: true })).toContainText("Apply or correct unfinished measurements");
  await page.getByLabel("Font size (in)", { exact: true }).fill("2.5");
  await page.getByLabel("Font size (in)", { exact: true }).press("Enter");
  await page.getByText("Fine-tune position", { exact: true }).click();
  await page.getByLabel("X center (in)", { exact: true }).fill("-20");
  await page.getByLabel("X center (in)", { exact: true }).press("Enter");
  for (const name of ["Download Design Image", "Download Design PDF"]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(page.locator(".output-feedback").filter({ visible: true })).toContainText(/outside|fit|face/iu);
    await expect(page.getByRole("button", { name, exact: true })).toBeEnabled();
  }
  expect(downloads).toEqual([]);
  expect(await page.getByTestId("inscription-name").getAttribute("x")).toBe("-20");
  await page.getByRole("button", { name: "Center horizontally" }).click();
  const png = await download(page, "Download Design Image", "monumentstudio-design.png");
  await inspectPng(page, png.bytes);
});

test("font fetch and unsupported PDF text fail honestly while JSON and PNG remain recoverable", async ({ page }) => {
  await editDesign(page, "upright-oval");
  const original = await designFile(page);
  await openOutputs(page);
  const downloads: string[] = []; page.on("download", (item) => downloads.push(item.suggestedFilename()));
  await page.route("**/fonts/NotoSans-Regular.ttf", (route) => route.fulfill({ status: 503, body: "Test font unavailable" }));
  await page.getByRole("button", { name: "Download Design PDF", exact: true }).click();
  await expect(page.locator(".output-feedback").filter({ visible: true })).toContainText("We couldn't create the document");
  expect(downloads).toEqual([]);
  await download(page, "Download Design Image", "monumentstudio-design.png");
  expect(await designFile(page)).toBe(original);
  await page.unroute("**/fonts/NotoSans-Regular.ttf");
  const recovered = await download(page, "Download Design PDF", "monumentstudio-design-summary.pdf");
  expectSummary((await readPdf(recovered.bytes)).text, true);
  await page.getByLabel("Name", { exact: true }).fill("NORTH 家");
  const unicodeDesign = await designFile(page);
  downloads.length = 0;
  await page.getByRole("button", { name: "Download Design PDF", exact: true }).click();
  await expect(page.locator(".output-feedback").filter({ visible: true })).toContainText("cannot display some of the text reliably");
  expect(downloads).toEqual([]);
  expect(await designFile(page)).toBe(unicodeDesign);
  await download(page, "Download Design Image", "monumentstudio-design.png");
});

test("responsive sharing controls and proposal dialogs pass automated accessibility without page overflow", async ({ page }, info) => {
  await editDesign(page, "upright-oval");
  const original = await designFile(page);
  let referencePng: Buffer | undefined;
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 1024, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport); await openOutputs(page);
    for (const name of ["Download Design Image", "Download Design PDF", "Create Customer Proposal"]) {
      const control = page.getByRole("button", { name, exact: true });
      await expect(control).toBeVisible();
      const box = await control.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    if (viewport.width > 1120) {
      // Expanded sharing must not crop the drawing inside a compressed stage.
      const stage = await page.locator(".drawing-stage").boundingBox();
      const frame = await page.locator(".drawing-stage > .drawing-frame").boundingBox();
      expect(frame!.y).toBeGreaterThanOrEqual(stage!.y);
      expect(frame!.y + frame!.height).toBeLessThanOrEqual(stage!.y + stage!.height + 1);
      expect(frame!.width / frame!.height).toBeCloseTo(960 / 610, 2);
    }
    await audit(page, `share-${viewport.width}`);
    const png = await download(page, "Download Design Image", "monumentstudio-design.png");
    // A fixed drawing snapshot must not depend on the preview's CSS viewport.
    if (referencePng) expect(png.bytes.equals(referencePng)).toBe(true); else referencePng = png.bytes;
    const capture = process.env.CAPTURE_D_EXPORTS === "1" && info.project.name === "chromium";
    const capturePath = (name: string) => capture ? path.join("docs", "images", name) : info.outputPath(name);
    await page.screenshot({ path: capturePath(`sprint-d-share-${viewport.width}.png`), fullPage: true, animations: "disabled" });
    await page.getByRole("button", { name: "Create Customer Proposal", exact: true }).click();
    const modal = page.getByRole("dialog", { name: "Create Customer Proposal" });
    await modal.getByLabel("Customer or family reference (optional)").fill("Fictional North family — example only");
    await modal.getByLabel("Proposal title (optional)").fill("A memorial design for your consideration");
    await audit(page, `proposal-${viewport.width}`);
    const box = await modal.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
    await modal.getByRole("button", { name: "Close and Clear Details" }).scrollIntoViewIfNeeded();
    await expect(modal.getByRole("button", { name: "Download Customer Proposal" })).toBeInViewport();
    await page.screenshot({ path: capturePath(`sprint-d-proposal-${viewport.width}.png`), fullPage: true, animations: "disabled" });
    await page.keyboard.press("Escape");
  }
  expect(await designFile(page)).toBe(original);
});

test("cancelled generation and a design changed during generation never download stale documents", async ({ page }) => {
  await openOutputs(page);
  const original = await designFile(page);
  const downloads: string[] = []; page.on("download", (item) => downloads.push(item.suggestedFilename()));
  let release!: () => void;
  let fontRequested!: () => void;
  let requested = new Promise<void>((resolve) => { fontRequested = resolve; });
  let gate = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/fonts/NotoSans-Regular.ttf", async (route) => {
    fontRequested(); await gate; await route.continue();
  });
  await page.getByRole("button", { name: "Create Customer Proposal", exact: true }).click();
  await page.getByRole("button", { name: "Download Customer Proposal", exact: true }).click();
  await requested;
  await page.keyboard.press("Escape"); release();
  await expect(page.locator(".output-feedback").filter({ visible: true })).toContainText("Proposal form closed");
  await expect(page.getByRole("button", { name: "Create Customer Proposal", exact: true })).toBeFocused();
  requested = new Promise<void>((resolve) => { fontRequested = resolve; });
  gate = new Promise<void>((resolve) => { release = resolve; });
  await page.getByRole("button", { name: "Download Design PDF", exact: true }).click();
  await requested;
  await page.locator("#tablet-width").fill("50"); release();
  await expect(page.locator(".output-feedback").filter({ visible: true })).toContainText("Your design changed while the output was being prepared");
  expect(downloads).toEqual([]);
  await page.unroute("**/fonts/NotoSans-Regular.ttf");
  await page.locator("#tablet-width").fill("48");
  expect(await designFile(page)).toBe(original);
  expect(await page.evaluate((key) => localStorage.getItem(key), savedKey)).toBeNull();
});
