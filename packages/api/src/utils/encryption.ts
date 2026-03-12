import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error("ENCRYPTION_KEY environment variable is not set");
  const buf = Buffer.from(key, "base64");
  if (buf.length !== 32) throw new Error("ENCRYPTION_KEY must be 32 bytes (base64-encoded)");
  return buf;
}

/**
 * Encrypt a string. Returns a base64 string containing iv + authTag + ciphertext.
 * Returns null if input is null/undefined/empty.
 */
export function encrypt(plaintext: string | null | undefined): string | null {
  if (plaintext == null || plaintext === "") return null;
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Format: iv (12) + authTag (16) + ciphertext
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

/**
 * Decrypt a base64 string produced by encrypt().
 * Returns null if input is null/undefined/empty.
 */
export function decrypt(ciphertext: string | null | undefined): string | null {
  if (ciphertext == null || ciphertext === "") return null;
  const key = getKey();
  const data = Buffer.from(ciphertext, "base64");
  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

/**
 * Encrypt a JSON-serializable value (e.g., goals array).
 * Returns a base64 encrypted string, or null if input is null/undefined.
 */
export function encryptJSON(value: unknown): string | null {
  if (value == null) return null;
  return encrypt(JSON.stringify(value));
}

/**
 * Decrypt a base64 string back to a parsed JSON value.
 * Returns null if input is null/undefined/empty.
 */
export function decryptJSON<T = unknown>(ciphertext: string | null | undefined): T | null {
  const plain = decrypt(ciphertext);
  if (plain == null) return null;
  return JSON.parse(plain) as T;
}

/**
 * Encrypt specific fields in an object. Returns a new object with encrypted values.
 */
export function encryptFields<T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[],
): T {
  const result = { ...obj };
  for (const field of fields) {
    const val = result[field];
    if (val != null && typeof val === "string") {
      (result as Record<string, unknown>)[field as string] = encrypt(val);
    }
  }
  return result;
}

/**
 * Decrypt specific fields in an object. Returns a new object with decrypted values.
 */
export function decryptFields<T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[],
): T {
  const result = { ...obj };
  for (const field of fields) {
    const val = result[field];
    if (val != null && typeof val === "string") {
      (result as Record<string, unknown>)[field as string] = decrypt(val);
    }
  }
  return result;
}
