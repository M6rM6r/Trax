import { z } from "zod";

export const geofenceSchema = z.object({
  id: z.number(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  address: z.string().min(1, "Address is required"),
  lat: z.number().min(-90, "Latitude must be >= -90").max(90, "Latitude must be <= 90"),
  lng: z.number().min(-180, "Longitude must be >= -180").max(180, "Longitude must be <= 180"),
  radius: z.number().positive("Radius must be positive"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
  active: z.boolean().default(true),
  employeesCount: z.number().optional(),
});

export const createGeofenceSchema = geofenceSchema.omit({ id: true });

export const geofenceListSchema = z.array(geofenceSchema);

export type GeofenceSchema = z.infer<typeof geofenceSchema>;
export type CreateGeofenceSchema = z.infer<typeof createGeofenceSchema>;
