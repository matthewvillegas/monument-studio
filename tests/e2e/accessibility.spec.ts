import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";

const savedKey = "monumentstudio.saved-design.v1";
const runtimeErrors = new WeakMap<Page, string[]>();

function capturePath(name: string) {
  // Ordinary regression runs must not overwrite documentation evidence.
  return process.env.CAPTURE_DOCS === "1"
    ? path.join("docs", "images", name)
    : test.info().outputPath(name);
}

async function tabTo(page: Page, target: Locator) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const key = await target.evaluate((element) => {
      const active = document.activeElement;
      if (active === element) return null;
      // Firefox does not wrap forward Tab from the last document control.
      // Use real reverse navigation for earlier controls, never programmatic focus.
      return active && (active.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_PRECEDING)
        ? "Shift+Tab"
        : "Tab";
    });
    if (!key) return;
    await page.keyboard.press(key);
  }
  await expect(
    target,
    "The control must be reachable using the Tab key",
  ).toBeFocused();
}

async function keyboardValue(page: Page, target: Locator, value: string) {
  await tabTo(page, target);
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.insertText(value);
  await page.keyboard.press("Tab");
}

async function keyboardActivate(page: Page, name: string) {
  await tabTo(page, page.getByRole("button", { name, exact: true }));
  await page.keyboard.press("Enter");
}

async function noOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    )
    .toBeLessThanOrEqual(1);
}

async function audit(page: Page, label: string) {
  await page.evaluate(() => document.fonts.ready);
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  await test.info().attach(`axe-${label}`, {
    body: JSON.stringify(
      { violations: result.violations, incomplete: result.incomplete },
      null,
      2,
    ),
    contentType: "application/json",
  });
  // Incomplete/manual-review findings remain in the report; an empty automated
  // violation list is not a WCAG conformance or screen-reader certification.
  expect(result.violations, `${label}: automated axe findings`).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  runtimeErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("dialog", async (dialog) => {
    expect(dialog.type()).toBe("beforeunload");
    await dialog.accept();
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "MonumentStudio", level: 1 }),
  ).toBeVisible();
});

test.afterEach(async ({ page }) => {
  expect(runtimeErrors.get(page) ?? []).toEqual([]);
});

test("automated accessibility checks cover normal, invalid, review, and dialog states", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await audit(page, "monument");
  await page.locator("#tablet-width").fill("121");
  await expect(page.locator("#tablet-width")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(page.locator("#tablet-width")).toHaveAccessibleDescription(
    /Must be no more than 120 in/,
  );
  await audit(page, "invalid-dimension");
  await page.locator("#tablet-width").fill("48");
  await page.getByRole("button", { name: "02 · Inscription" }).click();
  await page.getByLabel("Name", { exact: true }).clear();
  await expect(
    page.getByLabel("Name", { exact: true }),
  ).toHaveAccessibleDescription("Name inscription is empty.");
  await audit(page, "invalid-inscription");
  await page.getByLabel("Name", { exact: true }).fill("EXAMPLE FAMILY");
  await page.getByRole("button", { name: "03 · Design Review" }).click();
  await audit(page, "review");
  await page.getByRole("button", { name: "Save Design", exact: true }).click();
  await page.getByRole("button", { name: "01 · Monument" }).click();
  await page.locator("#tablet-width").fill("52");
  await page
    .getByRole("button", { name: "Open Saved Design", exact: true })
    .click();
  await audit(page, "replace-dialog");
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 390, height: 844 });
  await audit(page, "mobile");
  await page
    .getByRole("button", { name: "Expand drawing", exact: true })
    .click();
  await audit(page, "expanded-drawing");
});

test("keyboard-only editing, recovery, save, restore, download and import remain usable", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await tabTo(page, page.getByLabel("Monument shape", { exact: true }));
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Monument shape", { exact: true })).toHaveValue(
    "upright-oval",
  );
  await keyboardValue(
    page,
    page.getByLabel("Cap rise (in)", { exact: true }),
    "10",
  );
  await keyboardValue(page, page.locator("#tablet-width"), "121");
  await expect(page.locator("#tablet-width")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await keyboardValue(page, page.locator("#tablet-width"), "56");
  await expect(page.locator("#tablet-width")).toHaveAttribute(
    "aria-invalid",
    "false",
  );
  await keyboardActivate(page, "02 · Inscription");
  await keyboardValue(
    page,
    page.getByLabel("Name", { exact: true }),
    "EXAMPLE FAMILY",
  );
  await keyboardValue(
    page,
    page.getByLabel("Dates", { exact: true }),
    "1900 — 2000",
  );
  await keyboardActivate(page, "Position name");
  await expect(page.getByLabel("Font size (in)", { exact: true })).toBeFocused();
  await keyboardActivate(page, "Move right 0.25 inches");
  await expect(page.getByTestId("inscription-name")).toHaveAttribute(
    "x",
    "24.25",
  );
  await keyboardActivate(page, "Center horizontally");
  await expect(page.getByTestId("inscription-name")).toHaveAttribute("x", "28");
  await keyboardActivate(page, "03 · Design Review");
  await expect(page.getByTestId("profile-area-in2")).toBeVisible();
  const accessibleReview = await page
    .getByRole("complementary", { name: "Design review", exact: true })
    .ariaSnapshot();
  expect(accessibleReview).toContain("Tablet face area");
  expect(accessibleReview).toContain("Total volume");
  await test.info().attach("design-review-accessibility-tree", {
    body: accessibleReview,
    contentType: "text/plain",
  });
  await keyboardActivate(page, "Save Design");
  await expect(page.locator(".save-feedback")).toHaveText(
    "Design saved on this device.",
  );
  const expectedDocument = await page.evaluate(
    (key) => localStorage.getItem(key),
    savedKey,
  );
  await page.reload();
  await keyboardActivate(page, "Open Saved Design");
  const confirmation = page.getByRole("dialog", {
    name: "Replace current design?",
  });
  await expect(
    confirmation.getByRole("button", { name: "Keep Current Design" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Open Saved Design", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(confirmation).not.toBeVisible();
  await expect(page.locator("#tablet-width")).toHaveValue("56");
  await expect(page.getByTestId("inscription-name")).toHaveAttribute("x", "28");
  await tabTo(
    page,
    page.getByRole("button", { name: "Download Design File", exact: true }),
  );
  const downloadPending = page.waitForEvent("download");
  await page.keyboard.press("Enter");
  const download = await downloadPending;
  expect(await download.failure()).toBeNull();
  const file = (await download.path())!;
  expect(await readFile(file, "utf8")).toBe(expectedDocument);
  await tabTo(
    page,
    page.getByRole("button", { name: "Import Design File", exact: true }),
  );
  const chooserPending = page.waitForEvent("filechooser");
  await page.keyboard.press("Enter");
  await (await chooserPending).setFiles(file);
  await expect(
    confirmation.getByRole("button", { name: "Keep Current Design" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(page.locator(".save-feedback")).toContainText(
    "Design file imported.",
  );
  await expect(page.locator("#tablet-width")).toHaveValue("56");
  await expect(page.getByTestId("inscription-name")).toHaveText(
    "EXAMPLE FAMILY",
  );
  await expect(page.getByTestId("inscription-name")).toHaveAttribute("x", "28");
});

test("drawing focus does not switch modes and exposes keyboard positioning help", async ({
  page,
}) => {
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to design controls" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to drawing" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("region", { name: "Monument preview", exact: true })).toBeFocused();
  const name = page.getByRole("button", { name: /^Select name inscription:/ });
  await tabTo(page, name);
  await expect(
    page.getByRole("button", { name: "01 · Monument" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(name).toHaveAccessibleDescription(/arrow/i);
  await expect(name).toBeFocused();
  const focus = await name.evaluate((element) => ({
    style: getComputedStyle(element).outlineStyle,
    width: getComputedStyle(element).outlineWidth,
  }));
  expect(focus.style).not.toBe("none");
  expect(parseFloat(focus.width)).toBeGreaterThanOrEqual(2);
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "02 · Inscription" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("inscription-name")).toHaveAttribute(
    "x",
    "24.25",
  );
  const snapshot = await page
    .getByRole("region", { name: "Monument preview", exact: true })
    .ariaSnapshot();
  expect(snapshot).toContain("48 by 30 by 8 inch");
  expect(snapshot).toContain("Select name inscription: FAMILY NAME");
  await test.info().attach("drawing-accessibility-tree", {
    body: snapshot,
    contentType: "text/plain",
  });
});

test("expanded drawing magnifies without changing geometry and supports keyboard scrolling and cancellation", async ({
  page,
}) => {
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 1024, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page
      .getByRole("button", { name: "Save Design", exact: true })
      .click();
    const saved = await page.evaluate(
      (key) => localStorage.getItem(key),
      savedKey,
    );
    const pathBefore = await page
      .getByTestId("front-tablet-path")
      .getAttribute("d");
    const sideBefore = await page
      .getByTestId("side-tablet")
      .getAttribute("height");
    const originalWidth = (await page
      .getByRole("group", { name: /^48 by 30 by 8 inch/ })
      .boundingBox())!.width;
    await page
      .getByRole("button", { name: "Expand drawing", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Expanded drawing",
      exact: true,
    });
    await expect(dialog).toBeVisible();
    const drawing = dialog.getByRole("group", { name: /^48 by 30 by 8 inch/ });
    await expect(page.getByTestId("front-tablet-path")).toHaveCount(1);
    if (viewport.width === 390)
      expect((await drawing.boundingBox())!.width).toBeGreaterThan(
        originalWidth * 2,
      );
    await page
      .getByRole("button", { name: "Fit drawing", exact: true })
      .click();
    expect((await drawing.boundingBox())!.width).toBeLessThanOrEqual(
      viewport.width,
    );
    await page
      .getByRole("button", { name: "Enlarge drawing", exact: true })
      .click();
    const detail = page.getByRole("region", {
      name: "Drawing detail",
      exact: true,
    });
    await detail.focus();
    if (viewport.width === 390) {
      const initial = await detail.evaluate((element) => element.scrollLeft);
      await page.keyboard.press("ArrowRight");
      await expect
        .poll(() => detail.evaluate((element) => element.scrollLeft))
        .toBeGreaterThan(initial);
    }
    await expect(page.getByTestId("front-tablet-path")).toHaveAttribute(
      "d",
      pathBefore!,
    );
    await expect(page.getByTestId("side-tablet")).toHaveAttribute(
      "height",
      sideBefore!,
    );
    await noOverflow(page);
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Expand drawing", exact: true }),
    ).toBeFocused();
    await expect(page.getByTestId("save-state")).toHaveText(
      "Saved on this device",
    );
    expect(
      await page.evaluate((key) => localStorage.getItem(key), savedKey),
    ).toBe(saved);
    const downloadPending = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Download Design File", exact: true })
      .click();
    const download = await downloadPending;
    expect(await readFile((await download.path())!, "utf8")).toBe(saved);
  }
});

test("reflows at 320 CSS pixels and supports doubled text with usable touch controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await noOverflow(page);
  await page.getByRole("button", { name: "02 · Inscription" }).click();
  await noOverflow(page);
  for (const name of [
    "Position name",
    "Move up 0.25 inches",
    "Save Design",
    "Expand drawing",
  ]) {
    const box = await page
      .getByRole("button", { name, exact: true })
      .boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeGreaterThanOrEqual(44);
  }
  // CSS text resizing is intentionally distinct from actual browser UI zoom.
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  await noOverflow(page);
  const title = page.getByRole("heading", { name: "MonumentStudio", level: 1 });
  expect(await title.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
  await expect(page.getByLabel("Name", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Expand drawing", exact: true })
    .click();
  await noOverflow(page);
  await expect(
    page.getByRole("button", { name: "Close drawing", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
});

test("respects reduced motion and keeps forced-colors drawing controls usable where supported", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce", forcedColors: "active" });
  expect(
    await page.evaluate(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
  ).toBe(true);
  const supportsForcedColors = await page.evaluate(
    () => matchMedia("(forced-colors: active)").matches,
  );
  test.info().annotations.push({
    type: "forced-colors",
    description: supportsForcedColors
      ? "Emulation active"
      : "Engine does not activate forced-colors emulation; reduced-motion checked",
  });
  await page
    .getByRole("button", { name: "Expand drawing", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Expanded drawing", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Close drawing", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Expand drawing", exact: true }),
  ).toBeFocused();
  if (supportsForcedColors) {
    const colors = await page
      .getByTestId("inscription-name")
      .evaluate((element) => ({
        text: getComputedStyle(element).fill,
        face: getComputedStyle(
          document.querySelector('[data-testid="front-tablet-path"]')!,
        ).fill,
      }));
    expect(colors.text).not.toBe(colors.face);
    await page.screenshot({
      path: test.info().outputPath("forced-colors.png"),
      fullPage: true,
    });
  }
});

test("short viewports retain a reachable drawing and modal keyboard navigation", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 256 });
  await page.getByRole("button", { name: "Expand drawing", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Expanded drawing", exact: true });
  const close = dialog.getByRole("button", { name: "Close drawing", exact: true });
  const detail = dialog.getByRole("region", { name: "Drawing detail", exact: true });
  await expect(close).toBeFocused();
  await tabTo(page, detail);
  expect((await detail.boundingBox())!.height).toBeGreaterThanOrEqual(160);
  await expect(detail).toBeInViewport();
  await noOverflow(page);
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "Enlarge drawing", exact: true })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "Fit drawing", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  expect((await dialog.locator("svg").boundingBox())!.width).toBeGreaterThan(100);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Expand drawing", exact: true })).toBeFocused();
});

test("captures genuine Sprint C responsive and expanded views", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "Documentation images use Chromium; all engines run behavioral checks.",
  );
  await page
    .getByLabel("Monument shape", { exact: true })
    .selectOption("upright-oval");
  await page.getByLabel("Cap rise (in)", { exact: true }).fill("10");
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 1024, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await noOverflow(page);
    await page.screenshot({
      path: capturePath(`sprint-c-design-${viewport.width}.png`),
      fullPage: true,
      animations: "disabled",
    });
    await page
      .getByRole("button", { name: "Expand drawing", exact: true })
      .click();
    await expect(
      page.getByRole("dialog", { name: "Expanded drawing", exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: capturePath(`sprint-c-expanded-${viewport.width}.png`),
      animations: "disabled",
    });
    await page.keyboard.press("Escape");
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "02 · Inscription" }).click();
  await page.getByLabel("Name", { exact: true }).fill("EXAMPLE FAMILY");
  await page.screenshot({
    path: capturePath("sprint-c-inscription.png"),
    fullPage: true,
    animations: "disabled",
  });
});
