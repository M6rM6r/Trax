/**
 * Map theme constants for OpenLayers.
 * These are the only hex colors allowed in the codebase — all map styling
 * must reference these constants, never inline hex values.
 */
export const MAP_THEME = {
  /** Primary accent — bioluminescent teal */
  primary: "#2BA88C",
  /** Secondary accent — inactive geofence, secondary markers */
  secondary: "#6366f1",
  /** Background fill for map features */
  surface: "#1e293b",
  /** Light surface for map overlays */
  surfaceLight: "#e2e8f0",
  /** Stroke/border for map features */
  border: "#0f172a",
  /** White stroke for contrast */
  contrastStroke: "#fff",
  /** Employee location marker */
  employeeMarker: "#22c55e",
  /** Default geofence color — bioluminescent teal (must be raw hex for OpenLayers) */
  geofenceDefault: "#2BA88C",
} as const;
