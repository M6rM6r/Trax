import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { ApiError, httpClient } from "@/lib/services/httpClient";

describe("HttpClient", () => {
  describe("ApiError", () => {
    it("creates an ApiError with correct properties", () => {
      const error = new ApiError("Not found", 404, "/employees/1");
      expect(error.message).toBe("Not found");
      expect(error.statusCode).toBe(404);
      expect(error.endpoint).toBe("/employees/1");
      expect(error.name).toBe("ApiError");
    });
  });

  describe("httpClient instance", () => {
    it("is defined", () => {
      expect(httpClient).toBeDefined();
    });

    it("has get method", () => {
      expect(typeof httpClient.get).toBe("function");
    });

    it("has post method", () => {
      expect(typeof httpClient.post).toBe("function");
    });

    it("has put method", () => {
      expect(typeof httpClient.put).toBe("function");
    });

    it("has patch method", () => {
      expect(typeof httpClient.patch).toBe("function");
    });

    it("has delete method", () => {
      expect(typeof httpClient.delete).toBe("function");
    });
  });
});
