import "@testing-library/jest-dom";

if (typeof globalThis.Request === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  globalThis.Request = class Request {} as any;
}

if (typeof globalThis.Response === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  class MockResponse {
    constructor(body?: BodyInit | null, init?: ResponseInit) {
      this.body = body ?? null;
      this.status = init?.status ?? 200;
      this.statusText = init?.statusText ?? "OK";
      this.headers = new Headers(init?.headers);
    }

    status: number;
    statusText: string;
    headers: Headers;
    body: BodyInit | null;

    static json(body: unknown, init?: ResponseInit) {
      return new MockResponse(JSON.stringify(body), {
        ...init,
        headers: { ...(init?.headers ?? {}), "content-type": "application/json" },
      });
    }

    async text() {
      return typeof this.body === "string" ? this.body : "";
    }

    async json() {
      const text = await this.text();
      return text ? JSON.parse(text) : null;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  globalThis.Response = MockResponse as any;
}

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next-intl
jest.mock("next-intl", () => ({
  useLocale: () => "ar",
  useTranslations: () => (key: string) => key,
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock cookies-next
jest.mock("cookies-next", () => ({
  setCookie: jest.fn(),
  getCookie: jest.fn(),
  deleteCookie: jest.fn(),
}));

// Mock Firebase modules for Node.js test environment
jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(() => ({ name: "test" })),
  getApps: jest.fn(() => []),
  getApp: jest.fn(() => ({ name: "test" })),
}));

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({
    currentUser: null,
    onAuthStateChanged: jest.fn(() => jest.fn()),
  })),
  onAuthStateChanged: jest.fn(() => jest.fn()),
  getIdToken: jest.fn(() => Promise.resolve("mock-token")),
}));

jest.mock("firebase/storage", () => ({
  getStorage: jest.fn(() => ({})),
  ref: jest.fn(),
  uploadBytes: jest.fn(() => Promise.resolve({})),
  getDownloadURL: jest.fn(() => Promise.resolve("http://example.com/file.png")),
}));

jest.mock("firebase/analytics", () => ({
  getAnalytics: jest.fn(() => ({})),
  isSupported: jest.fn(() => Promise.resolve(false)),
}));

jest.mock("firebase/app-check", () => ({
  initializeAppCheck: jest.fn(),
  ReCaptchaV3Provider: jest.fn(),
}));
