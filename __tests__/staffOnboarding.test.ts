import { describe, it, expect } from "@jest/globals";
import {
  buildStaffCredentialsEmail,
  buildStaffCredentialsMessage,
  generateStaffUsername,
} from "@/lib/utils/staffOnboarding";

describe("staff onboarding utilities", () => {
  describe("generateStaffUsername", () => {
    it("prefers provided employeeNumber", () => {
      expect(
        generateStaffUsername({ employeeNumber: "EMP-123", email: "a@b.com", name: "User" })
      ).toBe("EMP-123");
    });

    it("falls back to email local-part", () => {
      expect(generateStaffUsername({ email: "employee@company.com" })).toBe("employee");
    });

    it("uses normalized name when email missing", () => {
      expect(generateStaffUsername({ name: "John Doe" })).toBe("john_doe");
    });
  });

  describe("buildStaffCredentialsMessage", () => {
    it("builds a professional multiline message", () => {
      const message = buildStaffCredentialsMessage({
        companyName: "Acme",
        email: "john@acme.com",
        username: "john_d",
        password: "P@ssword123",
      });

      expect(message).toContain("Acme");
      expect(message).toContain("john@acme.com");
      expect(message).toContain("john_d");
      expect(message).toContain("P@ssword123");
    });
  });

  describe("buildStaffCredentialsEmail", () => {
    it("returns normalized subject and body for mail clients", () => {
      const payload = buildStaffCredentialsEmail({
        companyName: "Acme",
        email: "john@acme.com",
        username: "john_d",
        password: "P@ssword123",
      });

      expect(payload.subject).toContain("Acme");
      expect(payload.body).toContain("john@acme.com");
      expect(payload.body).toContain("john_d");
    });
  });
});
