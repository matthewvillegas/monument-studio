import { describe, expect, it } from "vitest";

import { DEMO_DESIGN } from "@/data/mock-designer";
import {
  calculateNominalVolumes,
  cubicInchesToCubicFeet,
} from "@/lib/engineering/volumes";

const straight = { kind: "upright-straight" } as const;

describe("nominal area and component volume", () => {
  it("matches the independently multiplied default rectangular components", () => {
    const result = calculateNominalVolumes(DEMO_DESIGN.dimensions, straight);
    expect(result.tabletAreaIn2).toBe(1440); // 48 x 30
    expect(result.tabletVolumeIn3).toBe(11520); // 1440 x 8
    expect(result.baseVolumeIn3).toBe(6720); // 60 x 8 x 14
    expect(result.totalVolumeIn3).toBe(18240);
    expect(result.totalVolumeFt3).toBeCloseTo(10.555555555555556, 12);
    expect(result.tabletVolumeFt3 + result.baseVolumeFt3).toBeCloseTo(
      result.totalVolumeFt3,
      12,
    );
  });

  it("uses rectangular body plus semicircle rather than the oval's bounding rectangle", () => {
    const result = calculateNominalVolumes(
      {
        tablet: { width: 20, height: 20, thickness: 4 },
        base: { width: 24, height: 6, depth: 8 },
      },
      { kind: "upright-oval", capRiseIn: 10 },
    );
    // 20x10 body + half a radius-10 circle: 200 + 50pi square inches.
    expect(result.tabletAreaIn2).toBeCloseTo(357.07963267948966, 10);
    expect(result.tabletVolumeIn3).toBeCloseTo(1428.3185307179585, 10);
    expect(result.baseVolumeIn3).toBe(1152);
    expect(result.totalVolumeIn3).toBeCloseTo(2580.3185307179585, 10);
    expect(result.totalVolumeFt3).toBeCloseTo(1.4932398904617815, 12);
  });

  it("retains exact binary decimal dimensions and does not round before calculation", () => {
    const result = calculateNominalVolumes(
      {
        tablet: { width: 24.5, height: 18.25, thickness: 3.5 },
        base: { width: 30.5, height: 4.25, depth: 8.5 },
      },
      straight,
    );
    expect(result.tabletAreaIn2).toBe(447.125);
    expect(result.tabletVolumeIn3).toBe(1564.9375);
    expect(result.baseVolumeIn3).toBe(1101.8125);
    expect(result.totalVolumeIn3).toBe(2666.75);
  });

  it("scales extrusion volume, not area, in proportion to thickness", () => {
    const dimensions = DEMO_DESIGN.dimensions;
    const first = calculateNominalVolumes(dimensions, {
      kind: "upright-oval",
      capRiseIn: 12,
    });
    const next = calculateNominalVolumes(
      {
        ...dimensions,
        tablet: { ...dimensions.tablet, thickness: 12 },
      },
      { kind: "upright-oval", capRiseIn: 12 },
    );
    expect(next.tabletAreaIn2).toBe(first.tabletAreaIn2);
    expect(next.tabletVolumeIn3).toBe(first.tabletVolumeIn3 * 1.5);
    expect(next.baseVolumeIn3).toBe(first.baseVolumeIn3);
  });

  it("matches full-height cap reference volumes at the supported size extremes", () => {
    const minimum = calculateNominalVolumes(
      {
        tablet: { width: 12, height: 12, thickness: 2 },
        base: { width: 12, height: 2, depth: 4 },
      },
      { kind: "upright-oval", capRiseIn: 12 },
    );
    expect(minimum.tabletAreaIn2).toBeCloseTo(36 * Math.PI, 10);
    expect(minimum.tabletVolumeIn3).toBeCloseTo(72 * Math.PI, 10);
    expect(minimum.totalVolumeIn3).toBeCloseTo(72 * Math.PI + 96, 10);

    const maximum = calculateNominalVolumes(
      {
        tablet: { width: 120, height: 96, thickness: 24 },
        base: { width: 144, height: 24, depth: 48 },
      },
      { kind: "upright-oval", capRiseIn: 96 },
    );
    expect(maximum.tabletAreaIn2).toBeCloseTo(2880 * Math.PI, 9);
    expect(maximum.tabletVolumeIn3).toBeCloseTo(69120 * Math.PI, 8);
    expect(maximum.baseVolumeIn3).toBe(165888);
    expect(maximum.totalVolumeIn3).toBeCloseTo(69120 * Math.PI + 165888, 8);
  });

  it("scales area quadratically and volumes cubically under uniform resizing", () => {
    const first = calculateNominalVolumes(
      {
        tablet: { width: 24, height: 24, thickness: 4 },
        base: { width: 30, height: 4, depth: 8 },
      },
      { kind: "upright-oval", capRiseIn: 12 },
    );
    const double = calculateNominalVolumes(
      {
        tablet: { width: 48, height: 48, thickness: 8 },
        base: { width: 60, height: 8, depth: 16 },
      },
      { kind: "upright-oval", capRiseIn: 24 },
    );
    expect(double.tabletAreaIn2).toBe(first.tabletAreaIn2 * 4);
    expect(double.tabletVolumeIn3).toBe(first.tabletVolumeIn3 * 8);
    expect(double.baseVolumeIn3).toBe(first.baseVolumeIn3 * 8);
    expect(double.totalVolumeIn3).toBe(first.totalVolumeIn3 * 8);
  });

  it("rejects invalid dimensional/profile state instead of producing misleading numbers", () => {
    expect(() =>
      calculateNominalVolumes(
        {
          ...DEMO_DESIGN.dimensions,
          tablet: { width: 48, height: NaN, thickness: 8 },
        },
        straight,
      ),
    ).toThrow();
    expect(() =>
      calculateNominalVolumes(DEMO_DESIGN.dimensions, {
        kind: "upright-oval",
        capRiseIn: 0,
      }),
    ).toThrow();
  });
});

describe("explicit cubic-unit conversion", () => {
  it("converts a 12-inch cube to one cubic foot", () => {
    expect(cubicInchesToCubicFeet(1728)).toBe(1);
    expect(cubicInchesToCubicFeet(864)).toBe(0.5);
    expect(cubicInchesToCubicFeet(0)).toBe(0);
  });

  it("rejects negative and nonfinite volumes", () => {
    for (const value of [-1, NaN, Infinity, -Infinity]) {
      expect(() => cubicInchesToCubicFeet(value)).toThrow(RangeError);
    }
  });
});
