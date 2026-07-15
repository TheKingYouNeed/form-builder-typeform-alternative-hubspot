const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return Uint8Array.from(bytes).buffer;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function aesKey(encodedKey: string): Promise<CryptoKey> {
  const bytes = base64ToBytes(encodedKey);
  if (bytes.byteLength !== 32) throw new Error("TOKEN_ENCRYPTION_KEY must contain exactly 32 bytes");
  return crypto.subtle.importKey("raw", toArrayBuffer(bytes), "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptSecret(plaintext: string, encodedKey: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await aesKey(encodedKey), encoder.encode(plaintext));
  return `v1.${bytesToBase64Url(iv)}.${bytesToBase64Url(new Uint8Array(encrypted))}`;
}

export async function decryptSecret(ciphertext: string, encodedKey: string): Promise<string> {
  const [version, encodedIv, encodedData] = ciphertext.split(".");
  if (version !== "v1" || !encodedIv || !encodedData) throw new Error("Unsupported encrypted value");
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toArrayBuffer(base64UrlToBytes(encodedIv)) },
    await aesKey(encodedKey),
    toArrayBuffer(base64UrlToBytes(encodedData)),
  );
  return decoder.decode(decrypted);
}

async function hmacSha256(message: string, secret: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", toArrayBuffer(encoder.encode(secret)), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(message)));
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) return false;
  let difference = 0;
  for (let index = 0; index < a.byteLength; index += 1) difference |= a[index]! ^ b[index]!;
  return difference === 0;
}

export async function createSessionCookie(hubId: string, secret: string, maxAgeSeconds = 60 * 60 * 24 * 30): Promise<string> {
  const expiresAt = Math.floor(Date.now() / 1000) + maxAgeSeconds;
  const payload = `${hubId}.${expiresAt}`;
  const signature = bytesToBase64Url(await hmacSha256(payload, secret));
  return `fb_session=${payload}.${signature}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

export async function verifySessionCookie(cookieHeader: string | undefined, secret: string): Promise<string | null> {
  if (!cookieHeader) return null;
  const value = cookieHeader.split(/;\s*/u).find((part) => part.startsWith("fb_session="))?.slice("fb_session=".length);
  if (!value) return null;
  const [hubId, rawExpiry, signature] = value.split(".");
  if (!hubId || !rawExpiry || !signature || Number(rawExpiry) <= Math.floor(Date.now() / 1000)) return null;
  const expected = await hmacSha256(`${hubId}.${rawExpiry}`, secret);
  return constantTimeEqual(expected, base64UrlToBytes(signature)) ? hubId : null;
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
  return [...digest].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function randomToken(byteLength = 24): string {
  return bytesToBase64Url(crypto.getRandomValues(new Uint8Array(byteLength)));
}
