import { readFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { describe, expect, it } from "vitest";

import example from "@/examples/oval-memorial.design.json";
import { prepareExportModel } from "@/lib/exports/model";
import { buildDesignPdf, PdfTextError } from "@/lib/exports/pdf";

const fontBytes = new Uint8Array(readFileSync("public/fonts/NotoSans-Regular.ttf"));
const preparedAt = new Date("2026-10-14T12:30:00Z");

// A small, real PNG fixture validates the embedding path, not drawing fidelity.
// Actual generated monument raster/geometry comparison belongs to browser tests.
function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(name: string, data: Uint8Array): Buffer {
  const typeAndData = Buffer.concat([Buffer.from(name, "ascii"), data]);
  const result = Buffer.alloc(data.length + 12);
  result.writeUInt32BE(data.length, 0);
  typeAndData.copy(result, 4);
  result.writeUInt32BE(crc32(typeAndData), result.length - 4);
  return result;
}

function fixturePng(width = 96, height = 61): Uint8Array {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 2;
  const pixels = Buffer.alloc((width * 3 + 1) * height, 255);
  for (let row = 0; row < height; row += 1) pixels[row * (width * 3 + 1)] = 0;
  return new Uint8Array(Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header), chunk("IDAT", deflateSync(pixels)), chunk("IEND", new Uint8Array()),
  ]));
}

const png = fixturePng();

async function inspectPdf(bytes: Uint8Array) {
  const task = getDocument({ data: bytes.slice() });
  const pdf = await task.promise;
  const pages = [];
  for (let index = 1; index <= pdf.numPages; index += 1) {
    const page = await pdf.getPage(index);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const items = content.items.flatMap((item) => "str" in item ? [item] : []);
    pages.push({ width: viewport.width, height: viewport.height, items, text: items.map((item) => item.str).join(" ") });
  }
  const metadata = await pdf.getMetadata();
  await task.destroy();
  return { pages, metadata, text: pages.map((page) => page.text).join("\n") };
}

describe("locally generated design PDFs", () => {
  it("opens independently, embeds its font and image, and contains exact straight-top data and required limitations", async () => {
    const input = { ...example, profile: { kind: "upright-straight" } };
    const model = prepareExportModel(input);
    const before = JSON.stringify(model);
    const bytes = buildDesignPdf(model, png, { fontBytes, preparedAt });
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    expect(new TextDecoder().decode(bytes)).toContain("/FontFile2");
    expect(new TextDecoder().decode(bytes)).toContain("/Subtype /Image");
    const result = await inspectPdf(bytes);
    expect(result.pages[0]).toMatchObject({ width: 792, height: 612 });
    expect(result.pages.slice(1).every((page) => page.width === 612 && page.height === 792)).toBe(true);
    for (const value of [
      "Memorial Design Summary", "Villegas Headstones & Monuments LLC", "Straight-top upright",
      "48 in", "30 in", "8 in", "60 in", "14 in", "60 / 38 / 14 in", "FAMILY NAME",
      "Center X 24 in", "Baseline Y 12 in", "Font size 3 in", "1440 in²", "11520 in³",
      "6720 in³", "18240 in³", "10.555556 ft³", "1 ft³ = 1728 in³",
      "Not an approved manufacturing or installation specification", "device clock",
    ]) expect(result.text).toContain(value);
    expect(result.text).not.toContain("Oval cap rise");
    expect(result.text).not.toContain("Save Design");
    expect(JSON.stringify(model)).toBe(before);
  });

  it("preserves customized decimal dimensions, Unicode inscriptions and independent oval quantities", async () => {
    const input = structuredClone(example);
    input.dimensions.tablet.width = 48.25;
    input.inscriptions[0] = { ...input.inscriptions[0]!, content: "GARCÍA — ΜΑΡΙΑ — ИВАН", xIn: 23.125, yIn: 12.375, fontSizeIn: 2.75 };
    const model = prepareExportModel(input);
    // Forged derived fields must not replace quantities calculated from inches.
    model.volumes.totalVolumeIn3 = 0;
    model.quantityRows[0]!.value = "CORRUPT";
    const result = await inspectPdf(buildDesignPdf(model, png, { fontBytes, preparedAt, layoutWarnings: ["Name crosses the preliminary margin."] }));
    expect(result.text).toContain("Oval-top upright");
    expect(result.text).toMatch(/Oval cap rise\s+8 in/u);
    expect(result.text).toContain("48.25 in");
    expect(result.text).toContain("GARCÍA — ΜΑΡΙΑ — ИВАН");
    expect(result.text).toContain("Center X 23.125 in | Baseline Y 12.375 in | Font size 2.75 in");
    expect(result.text).toContain(((48.25 * 22 + Math.PI * 48.25 * 8 / 4) * 8 + 6720).toFixed(6));
    expect(result.text).toContain("Name crosses the preliminary margin.");
    expect(result.text).not.toContain("CORRUPT");
  });

  it("paginates maximum-length proposal fields and unbroken text without overflow or lost characters", async () => {
    const proposal = {
      familyReference: "A".repeat(120), title: "B".repeat(120), projectReference: "C".repeat(80),
      description: "É".repeat(1200), notes: "Ω".repeat(3000),
    };
    const model = prepareExportModel(example);
    const before = JSON.stringify(model.document);
    const result = await inspectPdf(buildDesignPdf(model, png, { fontBytes, preparedAt, proposal }));
    expect(result.pages.length).toBeGreaterThanOrEqual(4);
    expect(result.pages.filter((page) => page.width === 792)).toHaveLength(1);
    expect(result.text.match(/É/gu)).toHaveLength(1200);
    expect(result.text.match(/Ω/gu)).toHaveLength(3000);
    expect(result.text).toContain("Pricing to be confirmed following design review.");
    expect(result.text).toContain("not a binding contract");
    expect(result.text).toContain("applicable cemetery requirements");
    for (const page of result.pages) {
      for (const item of page.items) {
        const x = item.transform[4]!;
        const baselineY = item.transform[5]!;
        expect(x).toBeGreaterThanOrEqual(35.5);
        expect(x + item.width).toBeLessThanOrEqual(page.width - 35.5);
        expect(baselineY).toBeGreaterThanOrEqual(20);
        expect(baselineY).toBeLessThanOrEqual(page.height - 20);
      }
    }
    expect(JSON.stringify(model.document)).toBe(before);
    expect(model.document).not.toHaveProperty("proposal");
  });

  it("supports a completely optional proposal without inventing references, contacts or pricing", async () => {
    const result = await inspectPdf(buildDesignPdf(prepareExportModel(example), png, { fontBytes, preparedAt, proposal: {} }));
    expect(result.text).toContain("Customer Design Proposal");
    expect(result.text).toContain("A memorial design for your consideration");
    expect(result.text).not.toContain("Project reference");
    expect(result.text).not.toContain("Prepared for");
    expect(result.text).not.toMatch(/\$|@|MS-DEMO/u);
  });

  it.each(["漢字", "😀", "مرحبا", "אבג", "e\u0301", "bad\u0000text", "x\u200fy"])("fails explicitly for unsupported or unreliable text: %s", (content) => {
    const input = structuredClone(example);
    input.inscriptions[0]!.content = content;
    expect(() => buildDesignPdf(prepareExportModel(input), png, { fontBytes, preparedAt })).toThrow(PdfTextError);
  });

  it("rejects corrupt images, distorted aspect ratios, invalid dates, fonts and proposal input", () => {
    const model = prepareExportModel(example);
    expect(() => buildDesignPdf(model, new Uint8Array([1, 2, 3]), { fontBytes, preparedAt })).toThrow("PNG");
    expect(() => buildDesignPdf(model, fixturePng(96, 60), { fontBytes, preparedAt })).toThrow("proportions");
    expect(() => buildDesignPdf(model, png, { fontBytes, preparedAt: new Date(NaN) })).toThrow("date");
    expect(() => buildDesignPdf(model, png, { fontBytes: new Uint8Array(), preparedAt })).toThrow("font");
    expect(() => buildDesignPdf(model, png, { fontBytes, preparedAt, proposal: { notes: "x".repeat(3001) } })).toThrow();
  });
});
