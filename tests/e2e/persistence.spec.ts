import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

const savedKey = "monumentstudio.saved-design.v1";
const runtimeErrors = new WeakMap<Page, string[]>();

function referenceDocument() {
  return {
    format: "monumentstudio-design",
    schemaVersion: 1,
    units: "in",
    profile: { kind: "upright-oval", capRiseIn: 11.75 },
    dimensions: {
      tablet: { width: 54.5, height: 34.25, thickness: 9.25 },
      base: { width: 64.25, height: 9.5, depth: 16.25 },
    },
    inscriptions: [
      {
        id: "name",
        content: "NORTH FAMILY",
        xIn: 27.25,
        yIn: 11.75,
        fontSizeIn: 2.75,
      },
      {
        id: "dates",
        content: "1900 — 2000",
        xIn: 24,
        yIn: 17.4,
        fontSizeIn: 1.15,
      },
      {
        id: "epitaph",
        content: "In loving memory",
        xIn: 24,
        yIn: 22.8,
        fontSizeIn: 1,
      },
    ],
  };
}

async function inscriptionMode(page: Page) {
  await page.getByRole("button", { name: "02 · Inscription" }).click();
}

async function confirmReplacement(page: Page) {
  const dialog = page.getByRole("dialog", { name: "Replace current design?" });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Keep Current Design" }),
  ).toBeFocused();
  await dialog.getByRole("button", { name: "Replace Current Design" }).click();
  await expect(dialog).not.toBeVisible();
}

async function importJson(page: Page, text: string, name = "design.json") {
  const chooserPending = page.waitForEvent("filechooser");
  await page
    .getByRole("button", { name: "Import Design File", exact: true })
    .click();
  const chooser = await chooserPending;
  await chooser.setFiles({
    name,
    mimeType: "application/json",
    buffer: Buffer.from(text),
  });
}

async function downloadJson(page: Page) {
  const downloadPending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download Design File", exact: true })
    .click();
  const download = await downloadPending;
  expect(download.suggestedFilename()).toBe("monumentstudio-design.json");
  expect(await download.failure()).toBeNull();
  return readFile((await download.path())!, "utf8");
}

async function editReferenceDesign(page: Page) {
  await page
    .getByLabel("Monument shape", { exact: true })
    .selectOption("upright-oval");
  // Edit the supporting base first so every intermediate state is valid.
  for (const [field, value] of [
    ["base-width", "64.25"],
    ["base-height", "9.5"],
    ["base-depth", "16.25"],
    ["tablet-width", "54.5"],
    ["tablet-height", "34.25"],
    ["tablet-thickness", "9.25"],
    ["cap-rise", "11.75"],
  ]) {
    await page.locator(`#${field}`).fill(value!);
  }
  await inscriptionMode(page);
  await page.getByLabel("Name", { exact: true }).fill("NORTH FAMILY");
  await page.getByLabel("Dates", { exact: true }).fill("1900 — 2000");
  await page
    .getByLabel("Epitaph (optional)", { exact: true })
    .fill("In loving memory");
  await page
    .getByRole("button", { name: "Position name", exact: true })
    .click();
  await page.getByLabel("Font size (in)", { exact: true }).fill("2.75");
  await page.getByLabel("Font size (in)", { exact: true }).press("Enter");
  await page.getByRole("button", { name: "Move up 0.25 inches" }).click();
  await page.getByRole("button", { name: "Center horizontally" }).click();
}

async function designSnapshot(page: Page) {
  const text: Record<string, unknown> = {};
  for (const id of ["name", "dates", "epitaph"]) {
    text[id] = await page
      .getByTestId(`inscription-${id}`)
      .evaluate((element) => ({
        text: element.textContent,
        x: element.getAttribute("x"),
        y: element.getAttribute("y"),
        font: element.getAttribute("font-size"),
        anchor: element.getAttribute("text-anchor"),
      }));
  }
  await page.getByRole("button", { name: "03 · Design Review" }).click();
  const quantities: Record<string, string> = {};
  for (const id of [
    "profile-area-in2",
    "tablet-volume-in3",
    "base-volume-in3",
    "total-volume-in3",
    "total-volume-ft3",
  ]) {
    quantities[id] = await page.getByTestId(id).innerText();
  }
  return {
    text,
    quantities,
    path: await page.getByTestId("front-tablet-path").getAttribute("d"),
    side: await page.getByTestId("side-tablet").evaluate((element) => ({
      width: element.getAttribute("width"),
      height: element.getAttribute("height"),
      x: element.getAttribute("x"),
      y: element.getAttribute("y"),
    })),
  };
}

async function expectReferenceInputs(page: Page) {
  await page.getByRole("button", { name: "01 · Monument" }).click();
  await expect(page.getByLabel("Monument shape", { exact: true })).toHaveValue(
    "upright-oval",
  );
  for (const [field, value] of [
    ["tablet-width", "54.5"],
    ["tablet-height", "34.25"],
    ["tablet-thickness", "9.25"],
    ["base-width", "64.25"],
    ["base-height", "9.5"],
    ["base-depth", "16.25"],
    ["cap-rise", "11.75"],
  ])
    await expect(page.locator(`#${field}`)).toHaveValue(value!);
  await inscriptionMode(page);
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue(
    "NORTH FAMILY",
  );
  await expect(page.getByLabel("Dates", { exact: true })).toHaveValue(
    "1900 — 2000",
  );
  await expect(
    page.getByLabel("Epitaph (optional)", { exact: true }),
  ).toHaveValue("In loving memory");
  await expect(page.getByTestId("inscription-name")).toHaveAttribute(
    "x",
    "27.25",
  );
  await expect(page.getByTestId("inscription-name")).toHaveAttribute(
    "y",
    "11.75",
  );
  await expect(page.getByTestId("inscription-name")).toHaveAttribute(
    "font-size",
    "2.75",
  );
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

test("completes create, save, reload, restore, actual download, and import without geometric loss", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await editReferenceDesign(page);
  const before = await designSnapshot(page);
  // Independent analytical reference, not a value read back from the app model.
  const area = 54.5 * (34.25 - 11.75) + (Math.PI * 54.5 * 11.75) / 4;
  const base = 64.25 * 9.5 * 16.25;
  expect(
    Math.abs(
      Number(before.quantities["profile-area-in2"]!.replaceAll(",", "")) - area,
    ),
  ).toBeLessThan(0.01);
  expect(
    Math.abs(
      Number(before.quantities["total-volume-in3"]!.replaceAll(",", "")) -
        (area * 9.25 + base),
    ),
  ).toBeLessThan(0.01);
  await page.getByRole("button", { name: "Save Design", exact: true }).click();
  await expect(
    page.getByText("Design saved on this device.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("save-state")).toHaveText(
    "Saved on this device",
  );
  const saved = await page.evaluate(
    (key) => localStorage.getItem(key),
    savedKey,
  );
  expect(JSON.parse(saved!)).toEqual(referenceDocument());

  await page.reload();
  await expect(page.locator("#tablet-width")).toHaveValue("48");
  await page
    .getByRole("button", { name: "Open Saved Design", exact: true })
    .click();
  await confirmReplacement(page);
  await expect(
    page.getByText("Your design has been restored.", { exact: true }),
  ).toBeVisible();
  await expectReferenceInputs(page);
  expect(await designSnapshot(page)).toEqual(before);
  await page.screenshot({
    path: test.info().outputPath("current-restored-oval.png"),
    fullPage: true,
    animations: "disabled",
  });

  const exported = await downloadJson(page);
  expect(JSON.parse(exported)).toEqual(referenceDocument());
  expect(exported).toBe(saved);
  await page.getByRole("button", { name: "01 · Monument" }).click();
  await page.locator("#tablet-width").fill("50");
  await inscriptionMode(page);
  await page.getByLabel("Name", { exact: true }).fill("WORKING CHANGE");
  await importJson(page, exported);
  await confirmReplacement(page);
  await expect(
    page.getByText(
      "Design file imported. Choose Save Design to keep it on this device.",
      { exact: true },
    ),
  ).toBeVisible();
  await expectReferenceInputs(page);
  expect(await designSnapshot(page)).toEqual(before);
  expect(JSON.parse(await downloadJson(page))).toEqual(referenceDocument());
});

test("requires explicit replacement and cancellation preserves both working and saved designs", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Save Design", exact: true }).click();
  const first = await page.evaluate(
    (key) => localStorage.getItem(key),
    savedKey,
  );
  await page.locator("#tablet-width").fill("52");
  await page.getByRole("button", { name: "Save Design", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Replace saved design?" });
  await expect(
    dialog.getByRole("button", { name: "Keep Saved Design" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), savedKey),
  ).toBe(first);
  await expect(page.locator("#tablet-width")).toHaveValue("52");
  await page
    .getByRole("button", { name: "Open Saved Design", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Keep Current Design", exact: true })
    .click();
  await expect(page.locator("#tablet-width")).toHaveValue("52");
  await page.getByRole("button", { name: "Save Design", exact: true }).click();
  await page
    .getByRole("button", { name: "Replace Saved Design", exact: true })
    .click();
  const replacement = JSON.parse(
    (await page.evaluate((key) => localStorage.getItem(key), savedKey))!,
  );
  expect(replacement.dimensions.tablet.width).toBe(52);
  await expect(page.getByTestId("save-state")).toHaveText(
    "Saved on this device",
  );
});

test("failed and oversized imports preserve the working geometry, inscriptions, and saved slot", async ({
  page,
}) => {
  await editReferenceDesign(page);
  await page.getByRole("button", { name: "Save Design", exact: true }).click();
  const before = await designSnapshot(page);
  const raw = await page.evaluate((key) => localStorage.getItem(key), savedKey);
  const invalidDimension = referenceDocument();
  invalidDimension.dimensions.base.width = 12;
  const badFont = referenceDocument();
  badFont.inscriptions[0]!.fontSizeIn = 0;
  const badPosition = referenceDocument();
  badPosition.inscriptions[0]!.xIn = 241;
  const badRise = referenceDocument();
  badRise.profile.capRiseIn = 50;
  const invalid = [
    "{broken JSON",
    JSON.stringify({ ...referenceDocument(), schemaVersion: 2 }),
    JSON.stringify({ ...referenceDocument(), units: "px" }),
    JSON.stringify({ ...referenceDocument(), areaIn2: 999999 }),
    JSON.stringify({ ...referenceDocument(), dimensions: { tablet: {} } }),
    JSON.stringify(invalidDimension),
    JSON.stringify(badFont),
    JSON.stringify(badPosition),
    JSON.stringify(badRise),
    '{"__proto__":{"polluted":true}}',
    " ".repeat(65_537),
  ];
  for (const document of invalid) {
    await importJson(page, document);
    await expect(page.locator(".save-feedback")).toContainText(
      "Your current design hasn't changed.",
    );
    await expect(page.getByRole("dialog")).not.toBeVisible();
    expect(await designSnapshot(page)).toEqual(before);
    expect(
      await page.evaluate((key) => localStorage.getItem(key), savedKey),
    ).toBe(raw);
    expect(
      await page.evaluate(() => Object.hasOwn(Object.prototype, "polluted")),
    ).toBe(false);
  }
});

test("empty, corrupt, and unsupported saved records report readable errors without changing work", async ({
  page,
}) => {
  await page.locator("#tablet-width").fill("52");
  await page
    .getByRole("button", { name: "Open Saved Design", exact: true })
    .click();
  await expect(page.locator(".save-feedback")).toContainText(
    "There isn't a saved design on this browser yet.",
  );
  for (const raw of [
    "invalid JSON",
    JSON.stringify({ ...referenceDocument(), schemaVersion: 42 }),
  ]) {
    await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), {
      key: savedKey,
      raw,
    });
    await page
      .getByRole("button", { name: "Open Saved Design", exact: true })
      .click();
    await expect(page.locator(".save-feedback")).toContainText(
      "Your current design hasn't changed.",
    );
    await expect(page.locator("#tablet-width")).toHaveValue("52");
    expect(
      await page.evaluate((key) => localStorage.getItem(key), savedKey),
    ).toBe(raw);
    await page
      .getByRole("button", { name: "Save Design", exact: true })
      .click();
    await expect(
      page.getByRole("dialog", { name: "Replace saved design?" }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Keep Saved Design", exact: true })
      .click();
    expect(
      await page.evaluate((key) => localStorage.getItem(key), savedKey),
    ).toBe(raw);
  }
});

test("storage getter denial is handled and a downloadable backup remains available", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("Blocked for test", "SecurityError");
      },
    });
  });
  await page.reload();
  await page.locator("#tablet-width").fill("52");
  for (const action of ["Save Design", "Open Saved Design"]) {
    await page.getByRole("button", { name: action, exact: true }).click();
    await expect(page.locator(".save-feedback")).toContainText(
      "This browser isn't allowing local storage.",
    );
    await expect(page.locator("#tablet-width")).toHaveValue("52");
    await expect(page.getByTestId("save-state")).toHaveText("Unsaved changes");
  }
  expect(JSON.parse(await downloadJson(page)).dimensions.tablet.width).toBe(52);
});

test("quota failure preserves the previous save and leaves current changes unsaved", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Save Design", exact: true }).click();
  const original = await page.evaluate(
    (key) => localStorage.getItem(key),
    savedKey,
  );
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Full for test", "QuotaExceededError");
    };
  });
  await page.reload();
  await page.locator("#tablet-width").fill("52");
  await page.getByRole("button", { name: "Save Design", exact: true }).click();
  await page
    .getByRole("button", { name: "Replace Saved Design", exact: true })
    .click();
  await expect(page.locator(".save-feedback")).toContainText(
    "There isn't enough browser storage",
  );
  expect(
    await page.evaluate((key) => localStorage.getItem(key), savedKey),
  ).toBe(original);
  await expect(page.locator("#tablet-width")).toHaveValue("52");
  await expect(page.getByTestId("save-state")).toHaveText("Unsaved changes");
});

test("a saved-slot change while confirmation is open is not overwritten", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Save Design", exact: true }).click();
  await page.locator("#tablet-width").fill("52");
  await page.getByRole("button", { name: "Save Design", exact: true }).click();
  const changed = JSON.stringify(referenceDocument());
  await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), {
    key: savedKey,
    raw: changed,
  });
  await page
    .getByRole("button", { name: "Replace Saved Design", exact: true })
    .click();
  await expect(page.locator(".save-feedback")).toContainText(
    "The saved design changed in another tab.",
  );
  expect(
    await page.evaluate((key) => localStorage.getItem(key), savedKey),
  ).toBe(changed);
  await expect(page.locator("#tablet-width")).toHaveValue("52");
});

test("invalid dimension and persistent text drafts cannot silently be saved or downloaded", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Save Design", exact: true }).click();
  const original = await page.evaluate(
    (key) => localStorage.getItem(key),
    savedKey,
  );
  await page.locator("#tablet-width").fill("121");
  for (const action of ["Save Design", "Download Design File"]) {
    await page.getByRole("button", { name: action, exact: true }).click();
    await expect(page.locator(".save-feedback")).toContainText(
      "Apply or correct the unfinished measurements and text position fields",
    );
    expect(
      await page.evaluate((key) => localStorage.getItem(key), savedKey),
    ).toBe(original);
  }
  await page.locator("#tablet-width").fill("48");
  await inscriptionMode(page);
  await page.getByLabel("Font size (in)", { exact: true }).fill("0.1");
  await page.getByLabel("Font size (in)", { exact: true }).press("Enter");
  await page.getByRole("button", { name: "01 · Monument" }).click();
  await page.getByRole("button", { name: "Save Design", exact: true }).click();
  await expect(page.locator(".save-feedback")).toContainText(
    "Apply or correct the unfinished measurements and text position fields",
  );
  await expect(page.locator(".save-feedback")).toContainText(
    "Name (Font size)",
  );
  expect(
    await page.evaluate((key) => localStorage.getItem(key), savedKey),
  ).toBe(original);
  await page
    .getByRole("button", { name: "Open Saved Design", exact: true })
    .click();
  await confirmReplacement(page);
  await inscriptionMode(page);
  await expect(page.getByLabel("Font size (in)", { exact: true })).toHaveValue(
    "2.5",
  );
  await expect(page.getByTestId("save-state")).toHaveText(
    "Saved on this device",
  );
});

test("imported text is literal and profile-aware layout warnings are recomputed", async ({
  page,
}) => {
  const document = referenceDocument();
  document.inscriptions[0]!.content = '<img src=x onerror="alert(1)">';
  document.inscriptions[0]!.xIn = -20;
  await importJson(page, JSON.stringify(document));
  await confirmReplacement(page);
  await inscriptionMode(page);
  await expect(page.getByTestId("inscription-name")).toHaveText(
    document.inscriptions[0]!.content,
  );
  await expect(
    page.getByText("Name extends outside the monument face.", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("img[src=x]")).toHaveCount(0);
  await expect(page.getByTestId("inscription-name")).toHaveAttribute(
    "x",
    "-20",
  );
  expect(JSON.parse(await downloadJson(page))).toEqual(document);
});

test("unsaved navigation can be cancelled and saving removes the leave warning", async ({
  page,
}) => {
  page.removeAllListeners("dialog");
  await page.locator("#tablet-width").fill("52");
  await expect(page.getByTestId("save-state")).toHaveText("Unsaved changes");
  const warningPending = page.waitForEvent("dialog");
  // Do not wait for a successful page.reload() load event: this navigation is
  // deliberately cancelled. Schedule the same browser reload after evaluate.
  await page.evaluate(() =>
    window.setTimeout(() => window.location.reload(), 0),
  );
  const warning = await warningPending;
  expect(warning.type()).toBe("beforeunload");
  await warning.dismiss();
  await expect(page.locator("#tablet-width")).toHaveValue("52");
  await expect(page.getByTestId("save-state")).toHaveText("Unsaved changes");

  await page.getByRole("button", { name: "Save Design", exact: true }).click();
  await expect(page.getByTestId("save-state")).toHaveText(
    "Saved on this device",
  );
  const unexpectedDialogs: string[] = [];
  page.on("dialog", async (dialog) => {
    unexpectedDialogs.push(dialog.type());
    await dialog.accept();
  });
  await page.reload();
  await expect(page.locator("#tablet-width")).toHaveValue("48");
  expect(unexpectedDialogs).toEqual([]);
  const saved = JSON.parse(
    (await page.evaluate((key) => localStorage.getItem(key), savedKey))!,
  );
  expect(saved.dimensions.tablet.width).toBe(52);
});

test("save actions and replacement dialog remain accessible at desktop, tablet, and mobile widths", async ({
  page,
}) => {
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 1024, height: 900 },
    { width: 982, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.reload();
    for (const name of [
      "Save Design",
      "Open Saved Design",
      "Download Design File",
      "Import Design File",
    ]) {
      const button = page.getByRole("button", { name, exact: true });
      await expect(button).toBeVisible();
      await expect(button).toBeEnabled();
      const box = await button.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
    }
    await page
      .getByRole("button", { name: "Save Design", exact: true })
      .click();
    await expect(
      page.getByText("Design saved on this device.", { exact: true }),
    ).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        ),
      )
      .toBeLessThanOrEqual(1);
    if (viewport.width !== 982) {
      await page.screenshot({
        path: test.info().outputPath(`current-save-${viewport.width}.png`),
        fullPage: true,
        animations: "disabled",
      });
    }
    await page.locator("#tablet-width").fill("52");
    await page
      .getByRole("button", { name: "Open Saved Design", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Replace current design?",
    });
    const cancel = dialog.getByRole("button", { name: "Keep Current Design" });
    const replace = dialog.getByRole("button", {
      name: "Replace Current Design",
    });
    await expect(cancel).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(replace).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(cancel).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(replace).toBeFocused();
    const box = await dialog.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
    if (viewport.width === 390)
      await page.screenshot({
        path: test.info().outputPath("current-confirmation-mobile.png"),
        fullPage: true,
        animations: "disabled",
      });
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Open Saved Design", exact: true }),
    ).toBeFocused();
    await expect(page.locator("#tablet-width")).toHaveValue("52");
  }
});
