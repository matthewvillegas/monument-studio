import { jsPDF } from "jspdf";

import { prepareExportModel, type ExportModel, type ExportRow } from "@/lib/exports/model";
import { proposalDetailsSchema, type ProposalDetails } from "@/lib/exports/proposal";

const COMPANY = "Villegas Headstones & Monuments LLC";
const FONT = "MonumentNotoSans";
const MARGIN = 36;
const BODY_SIZE = 11;
const LINE = 16;
const PRELIMINARY =
  "Design preview and preliminary dimensional summary only. Not an approved manufacturing or installation specification.";
const NOMINAL =
  "Nominal solid geometry: a uniform-thickness tablet and rectangular base. Excludes engraving, bevels, holes, joints and fabrication allowances. Volume is not weight; no density or safety approval is implied. Display values are rounded to six decimal places; 1 ft³ = 1728 in³.";
const REVIEW =
  "Preliminary proposal, subject to final design confirmation, material availability, production review and applicable cemetery requirements. This is not a binding contract, manufacturing approval or final purchase order.";

export class PdfTextError extends Error {
  constructor(message = "This PDF cannot display some of the text reliably. Use supported Latin, Greek or Cyrillic text, or download the design file to preserve it.") {
    super(message);
    this.name = "PdfTextError";
  }
}

export interface DesignPdfOptions {
  fontBytes: Uint8Array;
  preparedAt: Date;
  proposal?: ProposalDetails;
  layoutWarnings?: readonly string[];
}

function binaryFont(bytes: Uint8Array): string {
  if (bytes.byteLength < 1000 || bytes.byteLength > 2_000_000) {
    throw new Error("The document font could not be loaded.");
  }
  let result = "";
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    result += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  }
  return result;
}

function glyphChecker(pdf: jsPDF): (codepoint: number) => number {
  const metadata: unknown = pdf.getFont().metadata;
  if (
    typeof metadata !== "object" || metadata === null ||
    !("characterToGlyph" in metadata) ||
    typeof metadata.characterToGlyph !== "function"
  ) {
    throw new Error("The document font could not be verified.");
  }
  const method = metadata.characterToGlyph;
  return (codepoint) => {
    const value: unknown = method.call(metadata, codepoint);
    if (typeof value !== "number" || !Number.isInteger(value)) {
      throw new Error("The document font returned an invalid glyph.");
    }
    return value;
  };
}

/**
 * jsPDF's TTF path is not a general shaping engine. Check both actual cmap
 * coverage and the supported simple-script boundary before writing any text.
 * Never replace unsupported characters or silently export missing glyph boxes.
 */
function checkText(text: string, glyph: (codepoint: number) => number): void {
  for (const character of text) {
    if (character === "\n" || character === "\r") continue;
    const codepoint = character.codePointAt(0)!;
    if (
      codepoint > 0xffff ||
      /[\p{Mark}\p{Control}\p{Format}\p{Surrogate}]/u.test(character) ||
      !/[\p{Script=Latin}\p{Script=Greek}\p{Script=Cyrillic}\p{Script=Common}]/u.test(character) ||
      glyph(codepoint) === 0
    ) {
      throw new PdfTextError();
    }
  }
}

/** Width-aware wrapping, including words longer than a complete line. */
export function wrapPdfText(pdf: jsPDF, text: string, width: number): string[] {
  if (!(Number.isFinite(width) && width > 0)) {
    throw new RangeError("Text width must be positive and finite.");
  }
  const lines: string[] = [];
  for (const paragraph of text.replace(/\r\n?/gu, "\n").split("\n")) {
    let line = "";
    const words = paragraph.split(/\s+/u).filter(Boolean);
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (pdf.getTextWidth(candidate) <= width) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      line = "";
      for (const character of word) {
        if (pdf.getTextWidth(character) > width) {
          throw new RangeError("The text column is too narrow for its font.");
        }
        if (line && pdf.getTextWidth(line + character) > width) {
          lines.push(line);
          line = "";
        }
        line += character;
      }
    }
    lines.push(line);
  }
  return lines;
}

/**
 * Local, synchronous document generation. Revalidate the canonical snapshot and
 * recompute geometry/quantities; never trust caller-supplied derived row values.
 * pngBytes is the trusted rasterizer's complete 960:610 design drawing.
 */
export function buildDesignPdf(
  input: ExportModel,
  pngBytes: Uint8Array,
  options: DesignPdfOptions,
): Uint8Array {
  const model = prepareExportModel(input.document);
  const proposal = options.proposal === undefined
    ? undefined
    : proposalDetailsSchema.parse(options.proposal);
  if (!(options.preparedAt instanceof Date) || !Number.isFinite(options.preparedAt.getTime())) {
    throw new RangeError("The preparation date is invalid.");
  }
  if (pngBytes.byteLength > 30_000_000 || pngBytes.length < 24 ||
      ![137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => pngBytes[index] === byte)) {
    throw new Error("The design image is not a supported PNG.");
  }
  const pngHeader = new DataView(pngBytes.buffer, pngBytes.byteOffset, pngBytes.byteLength);
  const imageWidth = pngHeader.getUint32(16);
  const imageHeight = pngHeader.getUint32(20);
  if (imageWidth === 0 || imageHeight === 0 || imageWidth > 8192 || imageHeight > 8192 ||
      imageWidth * 610 !== imageHeight * 960) {
    throw new Error("The design image has unexpected proportions.");
  }
  const warnings = options.layoutWarnings ?? [];
  if (warnings.length > 20 || warnings.some((warning) => typeof warning !== "string" || warning.length > 500)) {
    throw new Error("Unexpected layout review notes.");
  }
  const title = proposal ? "Customer Design Proposal" : "Memorial Design Summary";
  const pdf = new jsPDF({
    orientation: proposal ? "portrait" : "landscape",
    unit: "pt", format: "letter", compress: true, putOnlyUsedFonts: true,
  });
  pdf.addFileToVFS("NotoSans-Regular.ttf", binaryFont(options.fontBytes));
  pdf.addFont("NotoSans-Regular.ttf", FONT, "normal");
  pdf.setFont(FONT, "normal");
  const glyph = glyphChecker(pdf);
  const allText = [
    COMPANY, PRELIMINARY, NOMINAL, REVIEW, title,
    ...model.document.inscriptions.map((element) => element.content),
    ...model.specificationRows.flatMap((row) => [row.label, row.value]),
    ...model.quantityRows.flatMap((row) => [row.label, row.value]),
    ...Object.values(proposal ?? {}), ...warnings,
  ];
  allText.forEach((text) => { if (text !== undefined) checkText(text, glyph); });
  pdf.setCreationDate(options.preparedAt);
  pdf.setProperties({ title, subject: "Preliminary memorial design", author: COMPANY, creator: "MonumentStudio" });
  pdf.setLanguage("en-US");
  // The device clock is not a verified business-issued timestamp or design ID.
  const dateLabel = `Prepared ${options.preparedAt.toISOString().replace("T", " ").slice(0, 19)} UTC (device clock)`;
  let y = 106;
  const pageWidth = () => pdf.internal.pageSize.getWidth();
  const pageHeight = () => pdf.internal.pageSize.getHeight();
  const bodyWidth = () => pageWidth() - 2 * MARGIN;
  const header = () => {
    pdf.setTextColor(30, 30, 28);
    pdf.setFontSize(19);
    pdf.text("MonumentStudio", MARGIN, 30);
    pdf.setFontSize(10);
    pdf.text(COMPANY, MARGIN, 47);
    pdf.setFontSize(13);
    pdf.text(title, MARGIN, 67);
    pdf.setFontSize(8);
    pdf.setTextColor(83, 80, 76);
    pdf.text(dateLabel, pageWidth() - MARGIN, 30, { align: "right" });
    pdf.setDrawColor(200, 196, 189);
    pdf.setLineWidth(0.5);
    pdf.line(MARGIN, 80, pageWidth() - MARGIN, 80);
    pdf.setTextColor(30, 30, 28);
    pdf.setFontSize(BODY_SIZE);
  };
  const newPortrait = () => {
    pdf.addPage("letter", "portrait");
    header();
    y = 106;
  };
  const ensure = (height: number) => {
    if (y + height > pageHeight() - 60) newPortrait();
  };
  const paragraph = (text: string, gap = 10, size = BODY_SIZE) => {
    pdf.setFontSize(size);
    const lines = wrapPdfText(pdf, text, bodyWidth());
    const lineHeight = Math.max(LINE, size * 1.4);
    for (const line of lines) {
      ensure(lineHeight);
      pdf.setFontSize(size);
      pdf.text(line, MARGIN, y);
      y += lineHeight;
    }
    y += gap;
    pdf.setFontSize(BODY_SIZE);
  };
  const heading = (text: string, followingHeight = 32) => {
    ensure(32 + followingHeight);
    pdf.setFillColor(243, 241, 237);
    pdf.rect(MARGIN, y - 13, bodyWidth(), 24, "F");
    pdf.setFontSize(12);
    pdf.text(text, MARGIN + 8, y + 3);
    y += 31;
    pdf.setFontSize(BODY_SIZE);
  };
  const rows = (items: ExportRow[]) => {
    const valueX = MARGIN + 215;
    for (const row of items) {
      const labels = wrapPdfText(pdf, row.label, 203);
      const values = wrapPdfText(pdf, row.value, bodyWidth() - 215);
      const height = Math.max(labels.length, values.length) * LINE + 4;
      ensure(height);
      pdf.setTextColor(83, 80, 76);
      labels.forEach((line, index) => pdf.text(line, MARGIN, y + index * LINE));
      pdf.setTextColor(30, 30, 28);
      values.forEach((line, index) => pdf.text(line, valueX, y + index * LINE));
      y += height;
    }
    y += 9;
  };
  const preview = () => {
    header();
    // Both axes use exactly 0.75 pt per logical SVG unit; never fit independently.
    pdf.addImage(pngBytes, "PNG", MARGIN, 86, 720, 457.5);
    pdf.setFontSize(9);
    const noteLines = wrapPdfText(pdf, PRELIMINARY, bodyWidth());
    noteLines.forEach((line, index) => pdf.text(line, MARGIN, 560 + index * 12));
    pdf.setFontSize(BODY_SIZE);
  };

  if (proposal) {
    header();
    paragraph(proposal.title?.trim() || "A memorial design for your consideration", 16, 18);
    const references: ExportRow[] = [];
    if (proposal.familyReference?.trim()) references.push({ label: "Prepared for", value: proposal.familyReference });
    if (proposal.projectReference?.trim()) references.push({ label: "Project reference", value: proposal.projectReference });
    rows(references);
    if (proposal.description?.trim()) {
      heading("Design description");
      paragraph(proposal.description);
    }
    if (proposal.notes?.trim()) {
      heading("Consultant notes");
      paragraph(proposal.notes);
    }
    heading("For your review");
    paragraph(REVIEW);
    paragraph("Pricing to be confirmed following design review.");
    pdf.addPage("letter", "landscape");
  }
  preview();
  newPortrait();
  heading("Monument specifications");
  rows(model.specificationRows);
  heading("Inscription details");
  for (const element of model.document.inscriptions) {
    ensure(52);
    const label = element.id === "name" ? "Name" : element.id === "dates" ? "Dates" : "Epitaph";
    paragraph(`${label}: ${element.content || "(not provided)"}`, 0);
    paragraph(`Center X ${element.xIn} in | Baseline Y ${element.yIn} in | Font size ${element.fontSizeIn} in`, 6, 9);
  }
  paragraph("Positions are relative to the tablet's upper-left bounding corner. X is the horizontal text center; Y is the baseline. Font size is the em-square size, not letter height.", 10, 9);
  heading("Preliminary geometric quantities");
  rows(model.quantityRows);
  paragraph(NOMINAL, 10, 9);
  // Keep the drawing/material caveats with the quantities. The full approval
  // notice is already on the drawing page; repeating it as a separate section
  // created an almost-empty extra sheet for otherwise ordinary designs.
  paragraph("Drawing proportions are consistent, but this PDF is not a calibrated full-size production drawing. Stone appearance is demonstration material, not a verified supplier sample.", 0, 9);
  if (warnings.length > 0) {
    heading("Text layout review");
    paragraph("The current design has preliminary layout warnings. Confirm text placement and engraving requirements before production.");
    warnings.forEach((warning) => paragraph(warning, 5));
  }
  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    pdf.setPage(page);
    pdf.setFontSize(8);
    pdf.setTextColor(83, 80, 76);
    pdf.text("Preliminary design - review required", MARGIN, pageHeight() - 22);
    pdf.text(`${page} / ${pages}`, pageWidth() - MARGIN, pageHeight() - 22, { align: "right" });
  }
  return new Uint8Array(pdf.output("arraybuffer"));
}
