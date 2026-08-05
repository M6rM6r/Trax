import { describe, expect, it } from "@jest/globals";
import {
  assertClientAssignedCheckInAllowed,
  isInsideAssignedGeofence,
  resolveAssignedGeofenceId,
} from "@/lib/utils/assignedGeofence";

describe("resolveAssignedGeofenceId", () => {
  it("prefers server employee assignment over payload", () => {
    expect(resolveAssignedGeofenceId("server-zone", "client-zone")).toBe("server-zone");
  });

  it("falls back to payload only when server is missing", () => {
    expect(resolveAssignedGeofenceId(null, "client-zone")).toBe("client-zone");
    expect(resolveAssignedGeofenceId(undefined, "client-zone")).toBe("client-zone");
  });

  it("rejects empty / sentinel values", () => {
    expect(resolveAssignedGeofenceId("", null)).toBeNull();
    expect(resolveAssignedGeofenceId("null", null)).toBeNull();
    expect(resolveAssignedGeofenceId("undefined", "x")).toBeNull();
  });
});

describe("assertClientAssignedCheckInAllowed", () => {
  it("denies when no location", () => {
    expect(
      assertClientAssignedCheckInAllowed({
        assignedGeofenceId: "g1",
        allowedGeofencesCount: 1,
        isWithinAssignedGeofence: true,
        hasLocation: false,
      })
    ).toEqual({ ok: false, reason: "no_location" });
  });

  it("denies when no assignment", () => {
    expect(
      assertClientAssignedCheckInAllowed({
        assignedGeofenceId: null,
        allowedGeofencesCount: 0,
        isWithinAssignedGeofence: false,
        hasLocation: true,
      })
    ).toEqual({ ok: false, reason: "no_assignment" });
  });

  it("denies outside assigned zone", () => {
    expect(
      assertClientAssignedCheckInAllowed({
        assignedGeofenceId: "g1",
        allowedGeofencesCount: 1,
        isWithinAssignedGeofence: false,
        hasLocation: true,
      })
    ).toEqual({ ok: false, reason: "outside_assigned" });
  });

  it("allows only when inside assigned zone", () => {
    expect(
      assertClientAssignedCheckInAllowed({
        assignedGeofenceId: "g1",
        allowedGeofencesCount: 1,
        isWithinAssignedGeofence: true,
        hasLocation: true,
      })
    ).toEqual({ ok: true });
  });
});

describe("isInsideAssignedGeofence", () => {
  it("requires presence inside assigned radius + buffer", () => {
    const zone = { lat: 24.7136, lng: 46.6753, radius: 50 };
    expect(isInsideAssignedGeofence(24.7136, 46.6753, zone, 0)).toBe(true);
    const farLat = 24.7136 + 500 / 111320;
    expect(isInsideAssignedGeofence(farLat, 46.6753, zone, 0)).toBe(false);
  });
});
