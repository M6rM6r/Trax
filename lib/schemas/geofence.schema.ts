import { z } from "zod";

export const geofenceSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  address: z.string().trim().min(1, "Address is required"),
  lat: z.coerce.number().min(-90, "Latitude must be >= -90").max(90, "Latitude must be <= 90"),
  lng: z.coerce
    .number()
    .min(-180, "Longitude must be >= -180")
    .max(180, "Longitude must be <= 180"),
  radius: z.coerce.number().positive("Radius must be positive"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
  active: z.boolean().default(true),
  employeesCount: z.coerce.number().int().min(0).optional(),
});

export const createGeofenceSchema = z
  .object({
    name: z.string().trim().optional().default(""),
    address: z.string().trim().optional().default(""),
    lat: z.coerce.number().min(-90, "Latitude must be >= -90").max(90, "Latitude must be <= 90"),
    lng: z.coerce
      .number()
      .min(-180, "Longitude must be >= -180")
      .max(180, "Longitude must be <= 180"),
    radius: z.coerce.number().positive("Radius must be positive"),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
    active: z.boolean().default(true),
  })
  .transform((v) => {
    const fallbackName = `نطاق ${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}`;
    const fallbackAddress = `Map pin (${v.lat}, ${v.lng})`;

    return {
      ...v,
      name: v.name || fallbackName,
      address: v.address || fallbackAddress,
    };
  });

export const geofenceListSchema = z.array(geofenceSchema);

export type GeofenceSchema = z.infer<typeof geofenceSchema>;
export type CreateGeofenceSchema = z.infer<typeof createGeofenceSchema>;
