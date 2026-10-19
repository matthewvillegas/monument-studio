import { expect, test, type Page } from "@playwright/test";

const inscriptionModeName = "02 · Inscription";
const runtimeErrors = new WeakMap<Page, string[]>();

async function openDesigner(page: Page): Promise<void> {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "MonumentStudio", level: 1 }),
  ).toBeVisible();
}

async function openInscriptionMode(page: Page): Promise<void> {
  const inscriptionMode = page.getByRole("button", {
    name: inscriptionModeName,
  });
  await inscriptionMode.click();
  await expect(inscriptionMode).toHaveAttribute("aria-pressed", "true");
}

async function openFinePositionControls(page: Page): Promise<void> {
  const disclosure = page.locator("details").filter({
    has: page.locator("summary", { hasText: "Fine-tune position" }),
  });
  if (!(await disclosure.evaluate((element) => element.hasAttribute("open")))) {
    await disclosure.locator("summary").click();
  }
  await expect(page.getByLabel("X center (in)", { exact: true })).toBeVisible();
}

async function expectNoDocumentOverflow(page: Page): Promise<void> {
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

async function fillScreenshotDemo(page: Page): Promise<void> {
  await openInscriptionMode(page);
  await page.getByLabel("Name", { exact: true }).fill("VILLEGAS");
  await page.getByLabel("Dates", { exact: true }).fill("19XX — 20XX");
  await page
    .getByLabel("Epitaph (optional)", { exact: true })
    .fill("FOREVER IN OUR HEARTS");
  await expect(page.getByTestId("inscription-name")).toHaveText("VILLEGAS");
  await expect(page.getByTestId("inscription-epitaph")).toHaveText(
    "FOREVER IN OUR HEARTS",
  );
  await page.evaluate(() => document.fonts.ready);
}

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  runtimeErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await openDesigner(page);
});

test.afterEach(async ({ page }) => {
  expect(runtimeErrors.get(page) ?? []).toEqual([]);
});

test("exposes editable inscription content and commits position fields", async ({
  page,
}) => {
  await openInscriptionMode(page);
  await openFinePositionControls(page);

  const name = page.getByLabel("Name", { exact: true });
  const dates = page.getByLabel("Dates", { exact: true });
  const epitaph = page.getByLabel("Epitaph (optional)", { exact: true });
  const xCenter = page.getByLabel("X center (in)", { exact: true });
  const yBaseline = page.getByLabel("Y baseline (in)", { exact: true });
  const fontSize = page.getByLabel("Font size (in)", { exact: true });

  await expect(name).toBeVisible();
  await expect(dates).toBeVisible();
  await expect(epitaph).toBeVisible();
  await expect(xCenter).toBeVisible();
  await expect(yBaseline).toBeVisible();
  await expect(fontSize).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Reset Text Layout" }),
  ).toBeVisible();

  await name.fill("VILLEGAS");
  await dates.fill("19XX — 20XX");
  await page
    .getByRole("button", { name: "Position name", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Select name inscription: VILLEGAS",
    }),
  ).toBeVisible();
  await expect(page.getByTestId("inscription-name")).toHaveText("VILLEGAS");

  await xCenter.fill("20");
  await xCenter.press("Enter");
  await expect(page.getByTestId("inscription-name")).toHaveAttribute("x", "20");

  await yBaseline.fill("11");
  await fontSize.click();
  await expect(page.getByTestId("inscription-name")).toHaveAttribute("y", "11");

  await fontSize.fill("3");
  await fontSize.press("Enter");
  await expect(page.getByTestId("inscription-name")).toHaveAttribute(
    "font-size",
    "3",
  );

  await fontSize.fill("0.1");
  await fontSize.press("Enter");
  await expect(
    page.getByText("Font size must be at least 0.25 in. Preview unchanged.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByTestId("inscription-name")).toHaveAttribute(
    "font-size",
    "3",
  );
  await fontSize.fill("3");
  await fontSize.press("Enter");

  await xCenter.fill("");
  await xCenter.press("Enter");
  await expect(
    page.getByText("Enter a numeric position. Preview unchanged.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByTestId("inscription-name")).toHaveAttribute("x", "20");
  await xCenter.fill("20");
  await xCenter.press("Enter");

  await page.getByRole("button", { name: "Reset Text Layout" }).click();
  await expect(page.getByTestId("inscription-name")).toHaveAttribute("x", "24");
  await expect(page.getByTestId("inscription-name")).toHaveAttribute("y", "12");
  await expect(page.getByTestId("inscription-name")).toHaveAttribute(
    "font-size",
    "2.5",
  );
});

test("supports precise keyboard movement on canvas text", async ({ page }) => {
  await openInscriptionMode(page);
  await openFinePositionControls(page);
  await page.getByLabel("Name", { exact: true }).fill("VILLEGAS");

  const canvasName = page.getByRole("button", {
    name: "Select name inscription: VILLEGAS",
  });
  await canvasName.focus();
  await expect(canvasName).toBeFocused();
  await expect(canvasName).toHaveAttribute("aria-pressed", "true");

  await canvasName.press("ArrowRight");
  await expect(page.getByTestId("inscription-name")).toHaveAttribute(
    "x",
    "24.25",
  );
  await expect(page.getByLabel("X center (in)", { exact: true })).toHaveValue(
    "24.25",
  );

  await canvasName.press("Shift+ArrowDown");
  await expect(page.getByTestId("inscription-name")).toHaveAttribute("y", "13");
  await expect(page.getByLabel("Y baseline (in)", { exact: true })).toHaveValue(
    "13",
  );
});

test("keeps the last valid geometry while a dimension draft is invalid", async ({
  page,
}) => {
  const preview = page.getByRole("group", {
    name: /straight-top upright monument on a/i,
  });
  const tabletWidth = page.locator("#tablet-width");

  await expect(preview).toHaveAttribute("aria-label", /^48 by 30 by 8 inch/);
  await tabletWidth.fill("121");
  await expect(page.locator("#tablet-width-error")).toHaveText(
    "Must be no more than 120 in.",
  );
  await expect(
    page.getByText("Showing the last valid measurements"),
  ).toBeVisible();
  await expect(preview).toHaveAttribute("aria-label", /^48 by 30 by 8 inch/);

  await tabletWidth.fill("56");
  await expect(
    page.getByText("Preview follows your measurements"),
  ).toBeVisible();
  await expect(preview).toHaveAttribute("aria-label", /^56 by 30 by 8 inch/);
});

test("reports measured layout warnings and recovers without moving text", async ({
  page,
}) => {
  await openInscriptionMode(page);
  await openFinePositionControls(page);

  await expect(
    page.getByText(
      "Your text fits within the current layout guide. No overlaps detected.",
      { exact: true },
    ),
  ).toBeVisible();

  const xCenter = page.getByLabel("X center (in)", { exact: true });
  await xCenter.fill("-50");
  await xCenter.press("Enter");
  await expect(
    page.getByText("Name extends outside the monument face.", { exact: true }),
  ).toBeVisible();

  await xCenter.fill("24");
  await xCenter.press("Enter");
  await expect(
    page.getByText("Name extends outside the monument face.", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText(
      "Your text fits within the current layout guide. No overlaps detected.",
      { exact: true },
    ),
  ).toBeVisible();

  await page
    .getByRole("button", { name: "Position dates", exact: true })
    .click();
  await page.getByLabel("X center (in)", { exact: true }).fill("24");
  await page.getByLabel("X center (in)", { exact: true }).press("Enter");
  await page.getByLabel("Y baseline (in)", { exact: true }).fill("12");
  await page.getByLabel("Y baseline (in)", { exact: true }).press("Enter");
  await expect(
    page.getByText("Name overlaps dates.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Dates overlaps name.", { exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Reset Text Layout" }).click();
  await expect(
    page.getByText("Name overlaps dates.", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Dates overlaps name.", { exact: true }),
  ).toHaveCount(0);
});

test("keeps measured font-size warnings current with reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page
    .getByLabel("Monument shape", { exact: true })
    .selectOption("upright-oval");
  await page.locator("#tablet-height").fill("32");
  await page.locator("#tablet-thickness").fill("9");
  await openInscriptionMode(page);
  await page.getByLabel("Name", { exact: true }).fill("NORTH FAMILY");
  await page.getByLabel("Dates", { exact: true }).fill("1900 — 2000");
  await page
    .getByLabel("Epitaph (optional)", { exact: true })
    .fill("A life remembered");
  await page
    .getByRole("button", { name: "Position name", exact: true })
    .click();
  await page.getByRole("button", { name: "Move up 0.25 inches" }).click();
  await page.getByRole("button", { name: "Center horizontally" }).click();

  const name = page.getByTestId("inscription-name");
  const fontSize = page.getByLabel("Font size (in)", { exact: true });
  const success = page.getByText(
    "Your text fits within the current layout guide. No overlaps detected.",
    { exact: true },
  );
  await expect(success).toBeVisible();
  await fontSize.fill("8");
  await fontSize.press("Enter");
  await expect(name).toHaveAttribute("font-size", "8");
  // The browser's real rendered box exceeds the face. The application must
  // report that same geometry, including when reduced-motion CSS is active.
  await expect
    .poll(() =>
      name.evaluate(
        (element) => (element as unknown as SVGGraphicsElement).getBBox().width,
      ),
    )
    .toBeGreaterThan(48);
  await expect(
    page.getByText("Name extends outside the monument face.", { exact: true }),
  ).toBeVisible();
  await expect(success).toHaveCount(0);
  await expect(name).toHaveAttribute("x", "24");
  await expect(name).toHaveAttribute("y", "11.75");

  await fontSize.fill("2.5");
  await fontSize.press("Enter");
  await expect(name).toHaveAttribute("font-size", "2.5");
  await expect(success).toBeVisible();
  await expect(page.locator(".layout-warnings")).toHaveCount(0);
  await expect(name).toHaveAttribute("x", "24");
  await expect(name).toHaveAttribute("y", "11.75");
});

test("preserves inscription coordinates when monument dimensions resize", async ({
  page,
}) => {
  await openInscriptionMode(page);
  await page.getByLabel("Name", { exact: true }).fill("VILLEGAS");
  await expect(page.getByTestId("inscription-name")).toHaveAttribute("x", "24");
  await expect(page.getByTestId("inscription-name")).toHaveAttribute("y", "12");

  await page.getByRole("button", { name: "01 · Monument" }).click();
  await page.locator("#tablet-width").fill("56");
  await page.locator("#tablet-height").fill("36");

  await expect(page.getByTestId("inscription-name")).toHaveAttribute("x", "24");
  await expect(page.getByTestId("inscription-name")).toHaveAttribute("y", "12");
  await expect(
    page.getByRole("group", { name: /^56 by 36 by 8 inch/ }),
  ).toBeVisible();
});

test("offers alignment without coordinates and centers on the current tablet", async ({
  page,
}) => {
  await openInscriptionMode(page);
  const xCenter = page.getByLabel("X center (in)", { exact: true });
  const name = page.getByTestId("inscription-name");
  await expect(xCenter).toBeHidden();
  await expect(
    page.getByLabel("Font size (in)", { exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Move right 0.25 inches" }).click();
  await expect(name).toHaveAttribute("x", "24.25");
  await page.getByRole("button", { name: "Center horizontally" }).click();
  await expect(name).toHaveAttribute("x", "24");
  await expect(name).toHaveAttribute("y", "12");
  await expect(name).toHaveAttribute("font-size", "2.5");

  await page.getByRole("button", { name: "01 · Monument" }).click();
  await page.locator("#tablet-width").fill("56");
  await expect(name).toHaveAttribute("x", "24");
  await openInscriptionMode(page);
  await page.getByRole("button", { name: "Center horizontally" }).click();
  await expect(name).toHaveAttribute("x", "28");
  await expect(name).toHaveAttribute("y", "12");
  await openFinePositionControls(page);
  await expect(xCenter).toHaveValue("28");
});

test("uses the oval face rather than its rectangular envelope for text checks", async ({
  page,
}) => {
  await openInscriptionMode(page);
  await page.getByLabel("Name", { exact: true }).fill("A");
  await openFinePositionControls(page);
  await page.getByLabel("X center (in)", { exact: true }).fill("6");
  await page.getByLabel("X center (in)", { exact: true }).press("Enter");
  await page.getByLabel("Y baseline (in)", { exact: true }).fill("3");
  await page.getByLabel("Y baseline (in)", { exact: true }).press("Enter");

  // This measured text box fits the rectangle, but not the upper-left cap.
  const box = await page.getByTestId("inscription-name").evaluate((element) => {
    const bounds = (element as unknown as SVGGraphicsElement).getBBox();
    return {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    };
  });
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThan(48);
  expect(box.y + box.height).toBeLessThan(30);
  await expect(
    page.getByText("Name extends outside the monument face.", { exact: true }),
  ).toHaveCount(0);

  await page.getByRole("button", { name: "01 · Monument" }).click();
  await page
    .getByLabel("Monument shape", { exact: true })
    .selectOption("upright-oval");
  await page.getByLabel("Cap rise (in)", { exact: true }).fill("10");
  await openInscriptionMode(page);
  await expect(
    page.getByText("Name extends outside the monument face.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("inscription-name")).toHaveAttribute("x", "6");
  await expect(page.getByTestId("inscription-name")).toHaveAttribute("y", "3");
  await page.getByRole("button", { name: "Reset Text Layout" }).click();
  await expect(
    page.getByText("Name extends outside the monument face.", { exact: true }),
  ).toHaveCount(0);
});

test("calculates analytical oval volumes and retains them for invalid cap drafts", async ({
  page,
}) => {
  await page
    .getByLabel("Monument shape", { exact: true })
    .selectOption("upright-oval");
  const capRise = page.getByLabel("Cap rise (in)", { exact: true });
  await capRise.fill("10");
  const preview = page.getByRole("group", { name: /^48 by 30 by 8 inch/ });
  await expect(preview).toHaveAttribute("aria-label", /oval-top upright/i);
  const frontPath = page.getByTestId("front-tablet-path");
  const validPath = await frontPath.getAttribute("d");
  expect(validPath).toMatch(/[Aa]/);
  const sideHeight = await page
    .getByTestId("side-tablet")
    .getAttribute("height");
  expect(Number(sideHeight)).toBeGreaterThan(0);
  await page.getByRole("button", { name: "03 · Design Review" }).click();

  // Independently worked reference: W=48, H=30, R=10, T=8;
  // area = 960 + 120*pi; base = 60*8*14. UI rounds for display only.
  const reference = [
    ["profile-area-in2", 1336.9911184307753],
    ["tablet-volume-in3", 10695.928947446202],
    ["base-volume-in3", 6720],
    ["total-volume-in3", 17415.928947446202],
    ["total-volume-ft3", 10.078662585327663],
  ] as const;
  async function expectReferenceValues() {
    for (const [id, expected] of reference) {
      const output = page.getByTestId(id);
      await expect(output).toBeVisible();
      // The test IDs identify numeric values, not a compound unit label.
      const displayed = Number((await output.innerText()).replaceAll(",", ""));
      expect(Number.isFinite(displayed)).toBe(true);
      expect(Math.abs(displayed - expected)).toBeLessThan(0.01);
    }
  }
  await expectReferenceValues();

  for (const invalid of ["31", ""]) {
    await page.getByRole("button", { name: "01 · Monument" }).click();
    await capRise.fill(invalid);
    await expect(capRise).toHaveAttribute("aria-invalid", "true");
    await expect(preview).toHaveAttribute("aria-label", /oval-top upright/i);
    await expect(frontPath).toHaveAttribute("d", validPath!);
    await expect(page.getByTestId("side-tablet")).toHaveAttribute(
      "height",
      sideHeight!,
    );
    await page.getByRole("button", { name: "03 · Design Review" }).click();
    await expectReferenceValues();
  }
  await page.getByRole("button", { name: "01 · Monument" }).click();
  await capRise.fill("10");
  await expect(capRise).toHaveAttribute("aria-invalid", "false");
});

test("renders the analytical cap and its matching square-clearance guide", async ({
  page,
}) => {
  await page
    .getByLabel("Monument shape", { exact: true })
    .selectOption("upright-oval");
  await page.getByLabel("Cap rise (in)", { exact: true }).fill("10");
  const face = await page
    .getByTestId("front-tablet-path")
    .evaluate((element) => {
      const path = element as unknown as SVGGeometryElement;
      const box = path.getBBox();
      const scale = box.width / 48;
      const contains = (x: number, y: number) =>
        path.isPointInFill(new DOMPoint(box.x + x * scale, box.y + y * scale));
      return {
        height: box.height / scale,
        above: contains(9.6, 1.99),
        below: contains(9.6, 2.01),
        corner: contains(0.1, 0.1),
      };
    });
  // x=9.6 gives u=-0.6 and top=10*(1-sqrt(0.64))=2 inches.
  expect(face.height).toBeCloseTo(30, 4);
  expect(face.above).toBe(false);
  expect(face.below).toBe(true);
  expect(face.corner).toBe(false);
  const guide = await page
    .getByTestId("engraving-guide")
    .evaluate((element) => {
      const path = element as unknown as SVGGeometryElement;
      return {
        above: path.isPointInFill(new DOMPoint(10.6, 2.99)),
        below: path.isPointInFill(new DOMPoint(10.6, 3.01)),
      };
    });
  // The square margin moves this same boundary point +1 in on each axis.
  expect(guide).toEqual({ above: false, below: true });
  await page.getByRole("button", { name: "Show Layout Guidelines" }).click();
  await expect(page.getByTestId("engraving-guide")).toHaveCount(0);
  // Toggling a presentation aid must not change the physical profile.
  await expect(
    page.getByRole("group", { name: /^48 by 30 by 8 inch/ }),
  ).toHaveAttribute("aria-label", /oval-top upright/);
});

test("treats the epitaph as optional and renders it only when supplied", async ({
  page,
}) => {
  await openInscriptionMode(page);
  const epitaph = page.getByLabel("Epitaph (optional)", { exact: true });

  await expect(page.getByTestId("inscription-epitaph")).toHaveCount(0);
  await epitaph.fill("FOREVER IN OUR HEARTS");
  await expect(page.getByTestId("inscription-epitaph")).toHaveText(
    "FOREVER IN OUR HEARTS",
  );
  await epitaph.clear();
  await expect(page.getByTestId("inscription-epitaph")).toHaveCount(0);
  await expect(page.getByText("Epitaph inscription is empty.")).toHaveCount(0);
});

test("associates required blank inscription errors and recovers", async ({
  page,
}) => {
  await openInscriptionMode(page);
  const name = page.getByLabel("Name", { exact: true });
  const dates = page.getByLabel("Dates", { exact: true });
  const epitaph = page.getByLabel("Epitaph (optional)", { exact: true });

  await name.clear();
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(name).toHaveAttribute(
    "aria-describedby",
    /(?:^|\s)content-name-error(?:\s|$)/,
  );
  await expect(page.locator("#content-name-error")).toHaveText(
    "Name inscription is empty.",
  );
  await expect(page.getByTestId("inscription-name")).toHaveCount(0);

  await name.fill("VILLEGAS");
  await expect(name).toHaveAttribute("aria-invalid", "false");
  await expect(page.locator("#content-name-error")).toHaveCount(0);
  await expect(page.getByTestId("inscription-name")).toHaveText("VILLEGAS");

  await dates.clear();
  await expect(dates).toHaveAttribute("aria-invalid", "true");
  await expect(dates).toHaveAttribute(
    "aria-describedby",
    /(?:^|\s)content-dates-error(?:\s|$)/,
  );
  await expect(page.locator("#content-dates-error")).toHaveText(
    "Dates inscription is empty.",
  );
  await expect(page.getByTestId("inscription-dates")).toHaveCount(0);

  await dates.fill("19XX — 20XX");
  await expect(dates).toHaveAttribute("aria-invalid", "false");
  await expect(page.locator("#content-dates-error")).toHaveCount(0);
  await expect(page.getByTestId("inscription-dates")).toHaveText("19XX — 20XX");

  await expect(epitaph).not.toHaveAttribute("required", "");
  await expect(epitaph).not.toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#content-epitaph-error")).toHaveCount(0);
});

test("remains editable without document overflow at supported breakpoints", async ({
  page,
}) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1024, height: 900 },
    { width: 982, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expectNoDocumentOverflow(page);
    await openInscriptionMode(page);
    await openFinePositionControls(page);

    const demoName = `VILLEGAS ${viewport.width}`;
    await page.getByLabel("Name", { exact: true }).fill(demoName);
    await expect(page.getByTestId("inscription-name")).toHaveText(demoName);
    await expect(
      page.getByLabel("X center (in)", { exact: true }),
    ).toBeVisible();
    await expectNoDocumentOverflow(page);
  }
});

test("captures verified responsive views, oval profile, and design review", async ({
  page,
}) => {
  const captures = [
    {
      viewport: { width: 1440, height: 1000 },
      fileName: "sprint-b-inscription-desktop.png",
    },
    {
      viewport: { width: 1024, height: 900 },
      fileName: "sprint-b-inscription-tablet.png",
    },
    {
      viewport: { width: 390, height: 844 },
      fileName: "sprint-b-inscription-mobile.png",
    },
  ];

  for (const capture of captures) {
    await page.setViewportSize(capture.viewport);
    await page.goto("/");
    await fillScreenshotDemo(page);
    await expectNoDocumentOverflow(page);
    await page.screenshot({
      path: test
        .info()
        .outputPath(capture.fileName.replace("sprint-b", "current")),
      fullPage: true,
      animations: "disabled",
    });
  }

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await fillScreenshotDemo(page);
  await page.getByRole("button", { name: "01 · Monument" }).click();
  await page.screenshot({
    path: test.info().outputPath("current-desktop.png"),
    fullPage: true,
    animations: "disabled",
  });
  await page
    .getByLabel("Monument shape", { exact: true })
    .selectOption("upright-oval");
  await page.getByLabel("Cap rise (in)", { exact: true }).fill("10");
  await expect(
    page.getByRole("group", { name: /^48 by 30 by 8 inch/ }),
  ).toHaveAttribute("aria-label", /oval-top upright/i);
  await page.screenshot({
    path: test.info().outputPath("current-oval.png"),
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("button", { name: "03 · Design Review" }).click();
  await expect(page.getByTestId("profile-area-in2")).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath("current-review.png"),
    fullPage: true,
    animations: "disabled",
  });
});
