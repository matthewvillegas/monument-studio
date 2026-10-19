export type InscriptionId = "name" | "dates" | "epitaph";
export type InscriptionNumericProperty = "xIn" | "yIn" | "fontSizeIn";
export type InscriptionDrafts = Partial<
  Record<InscriptionId, Partial<Record<InscriptionNumericProperty, string>>>
>;

/**
 * Positions use tablet-local inches. `xIn` is the text's horizontal center
 * anchor and `yIn` is its baseline measured from the tablet face's top-left.
 */
export interface InscriptionElement {
  id: InscriptionId;
  content: string;
  xIn: number;
  yIn: number;
  fontSizeIn: number;
}

export type InscriptionWarningKind =
  | "outside-face"
  | "margin"
  | "overlap"
  | "empty"
  | "unmeasured";

export interface InscriptionLayoutWarning {
  id: InscriptionId;
  kind: InscriptionWarningKind;
  message: string;
}
