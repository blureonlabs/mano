import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const VERSION_1 = 0x01; // Current encryption version

function getKey(envVar: string = "ENCRYPTION_KEY"): Buffer | null {
  const raw = process.env[envVar];
  if (!raw) return null;
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== 32)
    throw new Error(`${envVar} must be 32 bytes (base64-encoded)`);
  return buf;
}

// Cache keys to avoid repeated env var reads + base64 decoding
let _currentKey: Buffer | null | undefined;
let _previousKey: Buffer | null | undefined;

function getCurrentKey(): Buffer {
  if (_currentKey === undefined) _currentKey = getKey("ENCRYPTION_KEY");
  if (!_currentKey) throw new Error("ENCRYPTION_KEY environment variable is not set");
  return _currentKey;
}

function getPreviousKey(): Buffer | null {
  if (_previousKey === undefined) _previousKey = getKey("ENCRYPTION_KEY_PREVIOUS");
  return _previousKey;
}

/**
 * Encrypt a string using AES-256-GCM with a version byte prefix.
 * Format: [version(1)] [iv(12)] [authTag(16)] [ciphertext]
 * Returns a base64 string, or null if input is null/undefined/empty.
 */
export function encrypt(plaintext: string | null | undefined): string | null {
  if (plaintext == null || plaintext === "") return null;

  const key = getCurrentKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Versioned format: version (1) + iv (12) + authTag (16) + ciphertext
  const result = Buffer.concat([
    Buffer.from([VERSION_1]),
    iv,
    authTag,
    encrypted,
  ]);

  return result.toString("base64");
}

/**
 * Attempt to decrypt data with a specific key.
 * Handles both versioned (VERSION_1 prefix) and legacy (no prefix) formats.
 */
function decryptWithKey(data: Buffer, key: Buffer): string {
  let iv: Buffer, authTag: Buffer, ciphertext: Buffer;

  if (data[0] === VERSION_1) {
    // Versioned format: [version(1)] [iv(12)] [authTag(16)] [ciphertext]
    iv = data.subarray(1, 1 + IV_LENGTH);
    authTag = data.subarray(1 + IV_LENGTH, 1 + IV_LENGTH + AUTH_TAG_LENGTH);
    ciphertext = data.subarray(1 + IV_LENGTH + AUTH_TAG_LENGTH);
  } else {
    // Legacy format: [iv(12)] [authTag(16)] [ciphertext]
    iv = data.subarray(0, IV_LENGTH);
    authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    ciphertext = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString(
    "utf8",
  );
}

/**
 * Decrypt a base64 string produced by encrypt().
 * Tries the current key first, then the previous key (for rotation),
 * then falls back to returning the raw string (legacy unencrypted data).
 * Returns null if input is null/undefined/empty.
 */
export function decrypt(ciphertext: string | null | undefined): string | null {
  if (ciphertext == null || ciphertext === "") return null;

  const data = Buffer.from(ciphertext, "base64");
  const currentKey = getCurrentKey();

  // Try current key first
  try {
    return decryptWithKey(data, currentKey);
  } catch {
    // Try previous key if available
    const prevKey = getPreviousKey();
    if (prevKey) {
      try {
        return decryptWithKey(data, prevKey);
      } catch {
        // Fall through to legacy handling
      }
    }

    // Legacy: return as-is (unencrypted data from before encryption was added)
    return ciphertext;
  }
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
export function decryptJSON<T = unknown>(
  ciphertext: string | null | undefined,
): T | null {
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
