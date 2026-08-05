import { describe, it, expect } from "@jest/globals";
import { calculateDistance, GEOFENCE_DISTANCE_BUFFER_METERS } from "@/lib/utils/geo";
import { isWithinAnyGeofence, findNearestGeofence } from "@/hooks/useGeolocation";
import type { Geofence } from "@/lib/types/trackingTypes";

const mk = (id: string, lat: number, lng: number, radius: number): Geofence => ({
  id,
  name: id,
  address: "",
  lat,
  lng,
  radius,
  color: "#000",
  active: true,
});

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

describe("geofence guards", () => {
  it("ignores zero-radius geofence (not within)", () => {
    const g = mk("z", 24.7136, 46.6753, 0);
    const r = isWithinAnyGeofence(24.7136, 46.6753, [g]);
    expect(r.isWithinRange).toBe(false);
    expect(r.nearestGeofence).toBeNull();
  });

  it("ignores negative-radius geofence", () => {
    const g = mk("neg", 24.7136, 46.6753, -10);
    const r = isWithinAnyGeofence(24.7136, 46.6753, [g]);
    expect(r.isWithinRange).toBe(false);
  });

  it("skips invalid lat/lng and denies check-in when all geofences are malformed", () => {
    const bad = mk("bad", 999, 999, 100);
    const r = isWithinAnyGeofence(24.7136, 46.6753, [bad]);
    expect(r.isWithinRange).toBe(false);
    expect(r.nearestGeofence).toBeNull();
  });

  it("returns within when inside valid geofence (no buffer needed)", () => {
    const g = mk("ok", 24.7136, 46.6753, 100);
    const r = isWithinAnyGeofence(24.7136, 46.6753, [g]);
    expect(r.isWithinRange).toBe(true);
    expect(r.nearestGeofence?.geofence.id).toBe("ok");
  });

  it("returns not within when outside valid geofence", () => {
    const g = mk("ok", 24.7136, 46.6753, 10);
    const r = isWithinAnyGeofence(24.72, 46.68, [g]);
    expect(r.isWithinRange).toBe(false);
    expect(r.nearestGeofence?.geofence.id).toBe("ok");
  });

  it("applies fixed buffer + GPS accuracy consistent with server check-in", () => {
    // Point ~40m north of center; radius 10 + buffer 50 + accuracy 0 => within
    const g = mk("buf", 24.7136, 46.6753, 10);
    const northLat = 24.7136 + 40 / 111320;
    const insideWithBuffer = isWithinAnyGeofence(northLat, 46.6753, [g], 0);
    expect(insideWithBuffer.isWithinRange).toBe(true);

    // Far outside even with buffer
    const farLat = 24.7136 + 200 / 111320;
    const outside = isWithinAnyGeofence(farLat, 46.6753, [g], 0);
    expect(outside.isWithinRange).toBe(false);
  });

  it("findNearestGeofence skips invalid and returns valid nearest", () => {
    const bad = mk("bad", 0, 0, 0);
    const ok = mk("ok", 24.7136, 46.6753, 100);
    const n = findNearestGeofence(24.7136, 46.6753, [bad, ok]);
    expect(n?.geofence.id).toBe("ok");
  });
});
