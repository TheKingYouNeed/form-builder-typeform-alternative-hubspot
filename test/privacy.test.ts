import { describe, expect, it } from "vitest";
import { maskEmail } from "../src/privacy";

describe("privacy helpers", () => {
  it("masks the local part without retaining the complete email", () => {
    expect(maskEmail("ada@example.com")).toBe("a***@example.com");
    expect(maskEmail("not-an-email")).toBe("invalid-email");
  });
});
