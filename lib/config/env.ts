import { z } from "zod";

export interface RuntimeEnvOverrides {
  NEXT_PUBLIC_USE_FIREBASE?: string | boolean;
  NEXT_PUBLIC_FIREBASE_API_KEY?: string;
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?: string;
  NEXT_PUBLIC_FIREBASE_PROJECT_ID?: string;
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?: string;
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?: string;
  NEXT_PUBLIC_FIREBASE_APP_ID?: string;
  NEXT_PUBLIC_FIREBASE_APP_CHECK_KEY?: string;
  NEXT_PUBLIC_FIREBASE_VAPID_KEY?: string;
}

export function resolveFirebaseAuthMode(overrides: RuntimeEnvOverrides = {}): boolean {
  const explicitValue = overrides.NEXT_PUBLIC_USE_FIREBASE;
  if (typeof explicitValue === "boolean") {
    return explicitValue;
  }

  if (typeof explicitValue === "string") {
    const normalized = explicitValue.trim().toLowerCase();
    if (normalized === "false") return false;
    if (normalized === "true") return true;
  }

  const firebaseClientConfig = [
    overrides.NEXT_PUBLIC_FIREBASE_API_KEY,
    overrides.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    overrides.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    overrides.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    overrides.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    overrides.NEXT_PUBLIC_FIREBASE_APP_ID,
  ].every((value) => typeof value === "string" && value.trim().length > 0);

  return firebaseClientConfig;
}

const optionalUrl = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().url().optional()
);

const envSchema = z
  .object({
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
    NEXT_PUBLIC_USE_MOCK: z.preprocess((v) => (v as string) === "true", z.boolean()).default(false),
    NEXT_PUBLIC_USE_FIREBASE: z
      .preprocess((v) => (v as string) === "true", z.boolean())
      .default(false),
    NEXT_PUBLIC_DEFAULT_MAP_LAT: z.coerce.number().default(24.7136),
    NEXT_PUBLIC_DEFAULT_MAP_LNG: z.coerce.number().default(46.6753),
    NEXT_PUBLIC_DEFAULT_MAP_ZOOM: z.coerce.number().default(12),
  })
  .passthrough();

export type EnvConfig = z.infer<typeof envSchema>;

function loadEnv(): EnvConfig {
  const envSource = {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
    NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_AI_URL: process.env.NEXT_PUBLIC_AI_URL,
    NEXT_PUBLIC_AI_API_KEY: process.env.NEXT_PUBLIC_AI_API_KEY,
    NEXT_PUBLIC_PRODUCTION_API_URL: process.env.NEXT_PUBLIC_PRODUCTION_API_URL,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
    NEXT_PUBLIC_USE_MOCK: process.env.NEXT_PUBLIC_USE_MOCK,
    NEXT_PUBLIC_USE_FIREBASE: process.env.NEXT_PUBLIC_USE_FIREBASE,
    NEXT_PUBLIC_DEFAULT_MAP_LAT: process.env.NEXT_PUBLIC_DEFAULT_MAP_LAT,
    NEXT_PUBLIC_DEFAULT_MAP_LNG: process.env.NEXT_PUBLIC_DEFAULT_MAP_LNG,
    NEXT_PUBLIC_DEFAULT_MAP_ZOOM: process.env.NEXT_PUBLIC_DEFAULT_MAP_ZOOM,
  };
  try {
    const result = envSchema.safeParse(envSource);
    if (!result.success) {
      console.warn(
        "[env] Validation failed, falling back to defaults:",
        result.error.issues.map((i) => i.path.join(".")).join(", ")
      );
      return envSchema.parse({ NEXT_PUBLIC_USE_MOCK: "false", NEXT_PUBLIC_USE_FIREBASE: "false" });
    }
    return result.data;
  } catch {
    return {
      NEXT_PUBLIC_APP_NAME: "Trax",
      NEXT_PUBLIC_APP_VERSION: "0.1.0",
      NEXT_PUBLIC_DEFAULT_LOCALE: "ar",
      NEXT_PUBLIC_USE_MOCK: false,
      NEXT_PUBLIC_USE_FIREBASE: false,
      NEXT_PUBLIC_DEFAULT_MAP_LAT: 24.7136,
      NEXT_PUBLIC_DEFAULT_MAP_LNG: 46.6753,
      NEXT_PUBLIC_DEFAULT_MAP_ZOOM: 12,
    } as EnvConfig;
  }
}

export const env = loadEnv();

export const useFirebaseAuth = resolveFirebaseAuthMode({
  NEXT_PUBLIC_USE_FIREBASE: process.env.NEXT_PUBLIC_USE_FIREBASE,
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});
