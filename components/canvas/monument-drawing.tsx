import type { CSSProperties, ReactNode } from "react";
import { PREVIEW_LAYOUT, createPreviewTransforms } from "@/lib/geometry/preview";
import { inchesToPixels, rectInchesToCanvas } from "@/lib/geometry/scaling";
import type { MonumentGeometry } from "@/types/profile";

const DRAWING_FONT_FAMILY = '"Aptos", "Segoe UI", Helvetica, Arial, sans-serif';
const LABEL_STYLE: CSSProperties = {
  fill: "#6c6962",
  fontFamily: DRAWING_FONT_FAMILY,
  fontSize: 14,
  fontWeight: 700,
  letterSpacing: 1.4,
};
const DIMENSION_STYLE: CSSProperties = {
  ...LABEL_STYLE,
  paintOrder: "stroke",
  stroke: "#f8f6f1",
  strokeLinejoin: "round",
  strokeWidth: 5,
};
const DIMENSION_LINE_STYLE: CSSProperties = { stroke: "#766f65", strokeWidth: 1 };
const CENTER_STYLE: CSSProperties = {
  stroke: "#9e978d",
  strokeDasharray: "7 6",
  strokeWidth: 0.8,
};
const GROUND_STYLE: CSSProperties = { stroke: "#888177", strokeWidth: 1.1 };

function formatInches(value: number, forExport: boolean): string {
  // Exports retain all supplied decimal digits rather than silently rounding.
  const formatted =
    forExport || Number.isInteger(value) ? String(value) : value.toFixed(2);
  return `${formatted}″`;
}

function HorizontalDimension({
  x1,
  x2,
  y,
  label,
  forExport,
}: {
  x1: number;
  x2: number;
  y: number;
  label: string;
  forExport: boolean;
}) {
  const lineStyle = forExport ? DIMENSION_LINE_STYLE : undefined;
  return (
    <g className="dimension-annotation" aria-hidden="true">
      <line x1={x1} y1={y} x2={x2} y2={y} style={lineStyle} />
      <line x1={x1} y1={y - 6} x2={x1} y2={y + 6} style={lineStyle} />
      <line x1={x2} y1={y - 6} x2={x2} y2={y + 6} style={lineStyle} />
      <text
        x={(x1 + x2) / 2}
        y={y - 8}
        textAnchor="middle"
        style={forExport ? DIMENSION_STYLE : undefined}
      >
        {label}
      </text>
    </g>
  );
}

function VerticalDimension({
  x,
  y1,
  y2,
  label,
  forExport,
}: {
  x: number;
  y1: number;
  y2: number;
  label: string;
  forExport: boolean;
}) {
  const middle = (y1 + y2) / 2;
  const lineStyle = forExport ? DIMENSION_LINE_STYLE : undefined;
  return (
    <g className="dimension-annotation" aria-hidden="true">
      <line x1={x} y1={y1} x2={x} y2={y2} style={lineStyle} />
      <line x1={x - 6} y1={y1} x2={x + 6} y2={y1} style={lineStyle} />
      <line x1={x - 6} y1={y2} x2={x + 6} y2={y2} style={lineStyle} />
      <text
        x={x - 10}
        y={middle}
        textAnchor="middle"
        transform={`rotate(-90 ${x - 10} ${middle})`}
        style={forExport ? DIMENSION_STYLE : undefined}
      >
        {label}
      </text>
    </g>
  );
}

/**
 * Shared presentation of validated geometry. There is no viewport, selection,
 * draft, DOM measurement, or persistence state here. Export supplies plain
 * inscription glyphs; the workspace supplies its interactive inscription layer.
 */
export function MonumentDrawing({
  geometry,
  inscriptions,
  forExport = false,
  idPrefix = "",
}: {
  geometry: MonumentGeometry;
  inscriptions: ReactNode;
  forExport?: boolean;
  idPrefix?: string;
}) {
  const transforms = createPreviewTransforms(geometry);
  const frontTablet = rectInchesToCanvas(geometry.front.tablet, transforms.front);
  const frontBase = rectInchesToCanvas(geometry.front.base, transforms.front);
  const sideTablet = rectInchesToCanvas(geometry.side.tablet, transforms.side);
  const sideBase = rectInchesToCanvas(geometry.side.base, transforms.side);
  const frontBottom = frontBase.y + frontBase.height;
  const sideBottom = sideBase.y + sideBase.height;
  const frontCenter = transforms.front.originPx.x + frontBase.width / 2;
  const sideCenter = transforms.side.originPx.x + sideBase.width / 2;
  const profileName =
    geometry.profile.kind === "upright-oval"
      ? "Oval-top upright"
      : "Straight-top upright";
  const label = `${geometry.dimensions.tablet.width} by ${geometry.dimensions.tablet.height} by ${geometry.dimensions.tablet.thickness} inch ${profileName.toLowerCase()} monument on a ${geometry.dimensions.base.width} by ${geometry.dimensions.base.height} by ${geometry.dimensions.base.depth} inch base.`;
  // Same validated cap as the analytical area. The uniform extrusion's side is T × H.
  const risePx =
    geometry.profile.kind === "upright-oval"
      ? inchesToPixels(geometry.profile.capRiseIn, transforms.front)
      : 0;
  const { x, y, width, height } = frontTablet;
  const frontPath =
    geometry.profile.kind === "upright-oval"
      ? `M ${x} ${y + height} L ${x} ${y + risePx} A ${width / 2} ${risePx} 0 0 1 ${x + width} ${y + risePx} L ${x + width} ${y + height} Z`
      : `M ${x} ${y} H ${x + width} V ${y + height} H ${x} Z`;
  const graniteId = `${idPrefix}granite-surface`;
  const shadowId = `${idPrefix}monument-shadow`;
  const graniteFill = `url(#${graniteId})`;
  const shadowFilter = `url(#${shadowId})`;
  const centerStyle = forExport ? CENTER_STYLE : undefined;
  const groundStyle = forExport ? GROUND_STYLE : undefined;
  const projectionStyle = forExport ? LABEL_STYLE : undefined;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${PREVIEW_LAYOUT.viewBox.width} ${PREVIEW_LAYOUT.viewBox.height}`}
      role={forExport ? "img" : "group"}
      aria-label={label}
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <title>{`${profileName} monument drawing`}</title>
      <desc>
        Front and side views of a {profileName.toLowerCase()} tablet centered on its base.
        {forExport
          ? " Preliminary visualization. Dimensions in inches. Not for production."
          : " Select inscription text to edit its position; use arrow keys for quarter-inch steps, or Shift for one-inch steps."}
      </desc>
      <defs>
        <pattern id={graniteId} width="44" height="38" patternUnits="userSpaceOnUse">
          <rect width="44" height="38" fill="#282825" />
          <circle cx="7" cy="9" r="0.7" fill="#aaa89f" opacity="0.25" />
          <circle cx="32" cy="15" r="0.55" fill="#d7d1c7" opacity="0.18" />
          <circle cx="19" cy="31" r="0.8" fill="#77756f" opacity="0.3" />
          <path d="M39 4l1.5 1.5M4 28l1.5-1" stroke="#d7d1c7" strokeWidth="0.5" opacity="0.18" />
        </pattern>
        <filter id={shadowId} x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#171715" floodOpacity="0.18" />
        </filter>
      </defs>
      <rect className="drawing-paper" x="0.5" y="0.5" width={PREVIEW_LAYOUT.viewBox.width - 1} height={PREVIEW_LAYOUT.viewBox.height - 1} fill="#f8f6f1" stroke="#d7d1c7" />
      <g transform={`translate(${PREVIEW_LAYOUT.front.offsetX} ${PREVIEW_LAYOUT.front.offsetY})`}>
        <text x="32" y="32" className="projection-label" style={projectionStyle}>FRONT VIEW</text>
        <line x1={frontCenter} y1={Math.max(52, frontTablet.y - 24)} x2={frontCenter} y2={frontBottom + 20} className="center-line" style={centerStyle} />
        <line x1="48" y1={frontBottom + 1} x2="655" y2={frontBottom + 1} className="ground-line" style={groundStyle} />
        <g filter={shadowFilter}>
          <path data-testid="front-tablet-path" d={frontPath} fill={graniteFill} stroke="#0e0e0d" strokeWidth="1.5" />
          <rect x={frontBase.x} y={frontBase.y} width={frontBase.width} height={frontBase.height} rx="1.5" fill={graniteFill} stroke="#0e0e0d" strokeWidth="1.5" />
          {geometry.profile.kind === "upright-straight" && (
            <line x1={frontTablet.x + 3} y1={frontTablet.y + 4} x2={frontTablet.x + frontTablet.width - 3} y2={frontTablet.y + 4} stroke="#b3b0a8" strokeWidth="1" opacity="0.45" />
          )}
        </g>
        <g transform={`translate(${frontTablet.x} ${frontTablet.y}) scale(${transforms.pixelsPerInch})`}>
          {inscriptions}
        </g>
        <HorizontalDimension
          x1={frontTablet.x}
          x2={frontTablet.x + frontTablet.width}
          y={frontTablet.y - 26}
          label={`TABLET ${formatInches(geometry.dimensions.tablet.width, forExport)}`}
          forExport={forExport}
        />
        <HorizontalDimension
          x1={frontBase.x}
          x2={frontBase.x + frontBase.width}
          y={frontBottom + 40}
          label={`BASE ${formatInches(geometry.dimensions.base.width, forExport)}`}
          forExport={forExport}
        />
        <VerticalDimension
          x={Math.min(frontTablet.x, frontBase.x) - 42}
          y1={frontTablet.y}
          y2={frontBottom}
          label={`OVERALL ${formatInches(geometry.overall.height, forExport)}`}
          forExport={forExport}
        />
      </g>
      <line x1="712" y1="32" x2="712" y2="576" stroke="#d7d1c7" />
      <g transform={`translate(${PREVIEW_LAYOUT.side.offsetX} ${PREVIEW_LAYOUT.side.offsetY})`}>
        <text x="18" y="32" className="projection-label" style={projectionStyle}>SIDE</text>
        <line x1={sideCenter} y1={Math.max(52, sideTablet.y - 24)} x2={sideCenter} y2={sideBottom + 20} className="center-line" style={centerStyle} />
        <line x1="12" y1={sideBottom + 1} x2="198" y2={sideBottom + 1} className="ground-line" style={groundStyle} />
        <g filter={shadowFilter}>
          <rect data-testid="side-tablet" x={sideTablet.x} y={sideTablet.y} width={sideTablet.width} height={sideTablet.height} rx="1" fill={graniteFill} stroke="#0e0e0d" strokeWidth="1.5" />
          <rect x={sideBase.x} y={sideBase.y} width={sideBase.width} height={sideBase.height} rx="1" fill={graniteFill} stroke="#0e0e0d" strokeWidth="1.5" />
        </g>
        <HorizontalDimension
          x1={sideBase.x}
          x2={sideBase.x + sideBase.width}
          y={sideBottom + 40}
          label={`DEPTH ${formatInches(geometry.dimensions.base.depth, forExport)}`}
          forExport={forExport}
        />
        <HorizontalDimension
          x1={sideTablet.x}
          x2={sideTablet.x + sideTablet.width}
          y={sideTablet.y - 26}
          label={`THK ${formatInches(geometry.dimensions.tablet.thickness, forExport)}`}
          forExport={forExport}
        />
      </g>
      <g aria-hidden="true">
        <text x="32" y="590" className="sheet-note" style={forExport ? { ...LABEL_STYLE, fontSize: 11, letterSpacing: 1.1 } : undefined}>
          PRELIMINARY VISUALIZATION · DIMENSIONS IN INCHES · NOT FOR PRODUCTION
        </text>
      </g>
    </svg>
  );
}
