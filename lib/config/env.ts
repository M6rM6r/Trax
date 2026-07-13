import { z } from "zod";

const optionalUrl = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().url().optional()
);

const envSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default("Trax"),
  NEXT_PUBLIC_APP_VERSION: z.string().default("0.1.0"),
  NEXT_PUBLIC_DEFAULT_LOCALE: z.string().default("ar"),
  NEXT_PUBLIC_API_URL: optionalUrl,
  NEXT_PUBLIC_APP_URL: optionalUrl,
  NEXT_PUBLIC_AI_URL: optionalUrl,
  NEXT_PUBLIC_AI_API_KEY: z.string().optional(),
  NEXT_PUBLIC_PRODUCTION_API_URL: optionalUrl,
  NEXT_PUBLIC_BASE_URL: optionalUrl,
  NEXT_PUBLIC_WS_URL: optionalUrl,
  NEXT_PUBLIC_USE_MOCK: z.preprocess((v) => (v as string) === "true", z.boolean()).default(true),
  NEXT_PUBLIC_DEFAULT_MAP_LAT: z.coerce.number().default(24.7136),
  NEXT_PUBLIC_DEFAULT_MAP_LNG: z.coerce.number().default(46.6753),
  NEXT_PUBLIC_DEFAULT_MAP_ZOOM: z.coerce.number().default(12),
});

export type EnvConfig = z.infer<typeof envSchema>;

function loadEnv(): EnvConfig {
  try {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
      return envSchema.parse({ NEXT_PUBLIC_USE_MOCK: "true" });
    }
    return result.data;
  } catch {
    return {
      NEXT_PUBLIC_APP_NAME: "Trax",
      NEXT_PUBLIC_APP_VERSION: "0.1.0",
      NEXT_PUBLIC_DEFAULT_LOCALE: "ar",
      NEXT_PUBLIC_USE_MOCK: true,
      NEXT_PUBLIC_DEFAULT_MAP_LAT: 24.7136,
      NEXT_PUBLIC_DEFAULT_MAP_LNG: 46.6753,
      NEXT_PUBLIC_DEFAULT_MAP_ZOOM: 12,
    } as EnvConfig;
  }
}

export const env = loadEnv();
