import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  encrypt,
  decrypt,
  encryptJSON,
  decryptJSON,
  encryptFields,
  decryptFields,
} from "../utils/encryption";

// Generate a valid 32-byte key in base64
const TEST_KEY = Buffer.from("0123456789abcdef0123456789abcdef").toString("base64");
const ALT_KEY = Buffer.from("abcdef0123456789abcdef0123456789").toString("base64");

describe("Encryption", () => {
  beforeEach(() => {
    // Reset encryption key cache by clearing module-level cached keys
    // We do this by setting known keys each time
    process.env.ENCRYPTION_KEY = TEST_KEY;
    delete process.env.ENCRYPTION_KEY_PREVIOUS;
  });

  afterEach(() => {
    delete process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY_PREVIOUS;
  });

  describe("encrypt / decrypt", () => {
    it("round-trips a string", () => {
      const plaintext = "hello world";
      const encrypted = encrypt(plaintext);
      expect(encrypted).not.toBeNull();
      expect(encrypted).not.toBe(plaintext);
      expect(decrypt(encrypted)).toBe(plaintext);
    });

    it("returns null for null input", () => {
      expect(encrypt(null)).toBeNull();
      expect(decrypt(null)).toBeNull();
    });

    it("returns null for undefined input", () => {
      expect(encrypt(undefined)).toBeNull();
      expect(decrypt(undefined)).toBeNull();
    });

    it("returns null for empty string input", () => {
      expect(encrypt("")).toBeNull();
      expect(decrypt("")).toBeNull();
    });

    it("produces different ciphertext for same plaintext (random IV)", () => {
      const a = encrypt("same text");
      const b = encrypt("same text");
      expect(a).not.toBeNull();
      expect(b).not.toBeNull();
      expect(a).not.toBe(b);
      // But both should decrypt to the same value
      expect(decrypt(a)).toBe("same text");
      expect(decrypt(b)).toBe("same text");
    });

    it("handles unicode and special characters", () => {
      const hindi = "मरीज़ चिंता की रिपोर्ट करता है";
      expect(decrypt(encrypt(hindi))).toBe(hindi);

      const clinical = "Diagnosis: Generalized Anxiety Disorder (GAD-7 score: 15/21)";
      expect(decrypt(encrypt(clinical))).toBe(clinical);

      const multiline = "Line 1\nLine 2\n\tIndented";
      expect(decrypt(encrypt(multiline))).toBe(multiline);
    });

    it("handles long text (clinical session notes)", () => {
      const longText = "Patient reports increased anxiety. ".repeat(100);
      expect(decrypt(encrypt(longText))).toBe(longText);
    });

    it("output is valid base64", () => {
      const encrypted = encrypt("test data");
      expect(encrypted).not.toBeNull();
      // Should not throw when parsing as base64
      const buf = Buffer.from(encrypted!, "base64");
      expect(buf.length).toBeGreaterThan(0);
      // Re-encoding should match (ensures it's valid base64)
      expect(buf.toString("base64")).toBe(encrypted);
    });
  });

  describe("encryptJSON / decryptJSON", () => {
    it("round-trips an object", () => {
      const obj = { diagnosis: "GAD", severity: "moderate", score: 15 };
      const encrypted = encryptJSON(obj);
      expect(encrypted).not.toBeNull();
      expect(typeof encrypted).toBe("string");
      const decrypted = decryptJSON(encrypted);
      expect(decrypted).toEqual(obj);
    });

    it("round-trips an array", () => {
      const arr = ["goal 1", "goal 2", "goal 3"];
      const encrypted = encryptJSON(arr);
      const decrypted = decryptJSON<string[]>(encrypted);
      expect(decrypted).toEqual(arr);
    });

    it("returns null for null input", () => {
      expect(encryptJSON(null)).toBeNull();
      expect(decryptJSON(null)).toBeNull();
    });

    it("returns null for undefined input", () => {
      expect(encryptJSON(undefined)).toBeNull();
      expect(decryptJSON(undefined)).toBeNull();
    });

    it("handles nested objects", () => {
      const nested = {
        patient: { name: "Test" },
        notes: [{ type: "subjective", content: "Feels better" }],
      };
      expect(decryptJSON(encryptJSON(nested))).toEqual(nested);
    });
  });

  describe("encryptFields / decryptFields", () => {
    it("encrypts specified fields and leaves others untouched", () => {
      const note = {
        id: "note-123",
        subjective: "Patient reports anxiety",
        objective: "Elevated heart rate",
        title: "Session Note #5",
      };

      const encrypted = encryptFields(note, ["subjective", "objective"]);

      // id and title should be unchanged
      expect(encrypted.id).toBe("note-123");
      expect(encrypted.title).toBe("Session Note #5");

      // subjective and objective should be encrypted (different from original)
      expect(encrypted.subjective).not.toBe("Patient reports anxiety");
      expect(encrypted.objective).not.toBe("Elevated heart rate");

      // Should be valid encrypted strings
      expect(typeof encrypted.subjective).toBe("string");
      expect(typeof encrypted.objective).toBe("string");
    });

    it("decrypts specified fields and leaves others untouched", () => {
      const note = {
        id: "note-123",
        subjective: "Patient reports anxiety",
        objective: "Elevated heart rate",
        title: "Session Note #5",
      };

      const encrypted = encryptFields(note, ["subjective", "objective"]);
      const decrypted = decryptFields(encrypted, ["subjective", "objective"]);

      expect(decrypted).toEqual(note);
    });

    it("handles null field values by leaving them as-is", () => {
      const note = {
        id: "note-123",
        subjective: null as string | null,
        objective: "Some observation",
      };

      const encrypted = encryptFields(note, ["subjective", "objective"]);
      // null fields should remain null (encryptFields checks for null)
      expect(encrypted.subjective).toBeNull();
      // objective should be encrypted
      expect(encrypted.objective).not.toBe("Some observation");
    });

    it("returns a new object (does not mutate original)", () => {
      const original = {
        id: "123",
        content: "sensitive data",
      };

      const encrypted = encryptFields(original, ["content"]);
      expect(original.content).toBe("sensitive data");
      expect(encrypted).not.toBe(original);
    });
  });

  describe("legacy and key rotation", () => {
    it("falls back to returning raw string for unencrypted legacy data", () => {
      // Plain text that was never encrypted - not valid base64 of encrypted data
      const legacyText = "This is a plain text clinical note from before encryption";
      const result = decrypt(legacyText);
      expect(result).toBe(legacyText);
    });
  });
});
