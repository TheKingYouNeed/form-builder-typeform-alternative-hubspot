import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createSessionCookie, decryptSecret, encryptSecret, verifySessionCookie } from "../src/crypto";

describe("secret protection", () => {
  it("encrypts and decrypts values with AES-GCM", async () => {
    const key = randomBytes(32).toString("base64");
    const encrypted = await encryptSecret("very-secret", key);
    expect(encrypted).not.toContain("very-secret");
    await expect(decryptSecret(encrypted, key)).resolves.toBe("very-secret");
  });

  it("signs and verifies the administrator session cookie", async () => {
    const cookie = await createSessionCookie("147681737", "session-secret", 300);
    await expect(verifySessionCookie(cookie, "session-secret")).resolves.toBe("147681737");
    await expect(verifySessionCookie(cookie.replace("147681737", "999"), "session-secret")).resolves.toBeNull();
  });
});
