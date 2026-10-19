import { calculateNominalVolumes } from "@/lib/engineering/volumes";
import { createMonumentGeometry } from "@/lib/geometry/profiles";
import {
  createDesignDocument,
  designDocumentSchema,
} from "@/lib/persistence/document";

export interface ExportRow {
  label: string;
  value: string;
}

/** Formatting is presentation only; the detached document retains exact inputs. */
export function formatExportQuantity(value: number): string {
  if (!Number.isFinite(value)) throw new RangeError("Invalid export quantity.");
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
    useGrouping: false,
  });
}

/** One validated snapshot feeds every output. No UI or measured pixels enter it. */
export function prepareExportModel(input: unknown) {
  const document = createDesignDocument(designDocumentSchema.parse(input));
  const { dimensions, profile } = document;
  const geometry = createMonumentGeometry(dimensions, profile);
  const volumes = calculateNominalVolumes(dimensions, profile);
  const profileLabel =
    profile.kind === "upright-oval" ? "Oval-top upright" : "Straight-top upright";
  const specificationRows: ExportRow[] = [
    { label: "Monument profile", value: profileLabel },
    { label: "Tablet width", value: `${dimensions.tablet.width} in` },
    { label: "Tablet height", value: `${dimensions.tablet.height} in` },
    { label: "Tablet thickness", value: `${dimensions.tablet.thickness} in` },
    { label: "Base width", value: `${dimensions.base.width} in` },
    { label: "Base height", value: `${dimensions.base.height} in` },
    { label: "Base depth", value: `${dimensions.base.depth} in` },
    ...(profile.kind === "upright-oval"
      ? [{ label: "Oval cap rise", value: `${profile.capRiseIn} in` }]
      : []),
    {
      label: "Overall width / height / depth",
      value: `${geometry.overall.width} / ${geometry.overall.height} / ${geometry.overall.depth} in`,
    },
  ];
  const quantityRows: ExportRow[] = [
    {
      label: "Tablet front-profile area",
      value: `${formatExportQuantity(volumes.tabletAreaIn2)} in²`,
    },
    {
      label: "Tablet volume",
      value: `${formatExportQuantity(volumes.tabletVolumeIn3)} in³ / ${formatExportQuantity(volumes.tabletVolumeFt3)} ft³`,
    },
    {
      label: "Base volume",
      value: `${formatExportQuantity(volumes.baseVolumeIn3)} in³ / ${formatExportQuantity(volumes.baseVolumeFt3)} ft³`,
    },
    {
      label: "Total volume",
      value: `${formatExportQuantity(volumes.totalVolumeIn3)} in³ / ${formatExportQuantity(volumes.totalVolumeFt3)} ft³`,
    },
  ];
  return {
    document,
    geometry,
    volumes,
    profileLabel,
    specificationRows,
    quantityRows,
  };
}

export type ExportModel = ReturnType<typeof prepareExportModel>;
