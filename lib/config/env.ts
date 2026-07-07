import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default("Trax"),
  NEXT_PUBLIC_APP_VERSION: z.string().default("0.1.0"),
  NEXT_PUBLIC_DEFAULT_LOCALE: z.string().default("ar"),

  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_AI_URL: z.string().url().optional(),
  NEXT_PUBLIC_PRODUCTION_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_BASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_WS_URL: z.string().url().optional(),
  NEXT_PUBLIC_USE_MOCK: z.preprocess((v) => (v as string) === "true", z.boolean()).default(true),

  NEXT_PUBLIC_DEFAULT_MAP_LAT: z.coerce.number().default(24.7136),
  NEXT_PUBLIC_DEFAULT_MAP_LNG: z.coerce.number().default(46.6753),
  NEXT_PUBLIC_DEFAULT_MAP_ZOOM: z.coerce.number().default(12),

  NEXT_PUBLIC_ANALYTICS_ID: z.string().optional(),

  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: z.string().optional(),

  NEXT_PUBLIC_FEATURE_LIVE_TRACKING: z
    .preprocess((v) => (v as string) === "true", z.boolean())
    .default(true),
  NEXT_PUBLIC_FEATURE_GEOFENCES: z
    .preprocess((v) => (v as string) === "true", z.boolean())
    .default(true),
  NEXT_PUBLIC_FEATURE_ATTENDANCE_REPORTS: z
    .preprocess((v) => (v as string) === "true", z.boolean())
    .default(true),
  NEXT_PUBLIC_FEATURE_EXPORT_EXCEL: z
    .preprocess((v) => (v as string) === "true", z.boolean())
    .default(true),
});

export type EnvConfig = z.infer<typeof envSchema>;

function loadEnv(): EnvConfig {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment configuration");
  }
  return parsed.data;
}

export const env = loadEnv();
