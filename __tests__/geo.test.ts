import { describe, it, expect } from "@jest/globals";
import { calculateDistance, GEOFENCE_DISTANCE_BUFFER_METERS } from "@/lib/utils/geo";

describe("geo utils", () => {
  it("returns zero for identical points", () => {
    expect(calculateDistance(24.7136, 46.6753, 24.7136, 46.6753)).toBeCloseTo(0, 6);
  });

  it("computes ~111.195 km per degree latitude at equator (approx)", () => {
    // 1 degree latitude is roughly 111.195 km
    const d = calculateDistance(0, 0, 1, 0);
    expect(d).toBeGreaterThan(111000);
    expect(d).toBeLessThan(112000);
  });

  it("computes symmetric distance", () => {
    const a = calculateDistance(24.7136, 46.6753, 21.4858, 39.1925);
    const b = calculateDistance(21.4858, 39.1925, 24.7136, 46.6753);
    expect(a).toBeCloseTo(b, 6);
  });

  it("antipodal points are approximately half circumference", () => {
    const d = calculateDistance(0, 0, 0, 180);
    // Earth circumference ~40,030,000 m; half ~20,015,000 m
    expect(d).toBeGreaterThan(19900000);
    expect(d).toBeLessThan(20100000);
  });

  it("exports a positive buffer constant", () => {
    expect(GEOFENCE_DISTANCE_BUFFER_METERS).toBeGreaterThan(0);
  });
});
