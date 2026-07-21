import { describe, expect, it } from "@jest/globals";
import { resolveFirebaseAuthMode } from "@/lib/config/env";

describe("resolveFirebaseAuthMode", () => {
  it("enables Firebase auth when client config is present and the flag is not explicitly disabled", () => {
    expect(
      resolveFirebaseAuthMode({
        NEXT_PUBLIC_FIREBASE_API_KEY: "key",
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "domain",
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: "project",
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "bucket",
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "sender",
        NEXT_PUBLIC_FIREBASE_APP_ID: "app",
      })
    ).toBe(true);
  });

  it("respects an explicit false override", () => {
    expect(
      resolveFirebaseAuthMode({
        NEXT_PUBLIC_USE_FIREBASE: "false",
        NEXT_PUBLIC_FIREBASE_API_KEY: "key",
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "domain",
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: "project",
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "bucket",
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "sender",
        NEXT_PUBLIC_FIREBASE_APP_ID: "app",
      })
    ).toBe(false);
  });
});
