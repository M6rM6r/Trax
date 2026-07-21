import { GET } from "@/app/api/health/route";

describe("Health route", () => {
  it("returns a healthy status payload", async () => {
    const response = await GET();

    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.status).toBe("ok");
    expect(payload.service).toBe("trax");
    expect(typeof payload.timestamp).toBe("string");
    expect(payload.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(payload.version).toBeDefined();
  });
});
