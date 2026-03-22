/**
 * ClinicalDataService — centralises encryption/decryption of clinical data fields.
 *
 * Because @mano/domain cannot depend on @mano/api, the encrypt/decrypt primitives
 * are injected at construction time. The API layer wires them up:
 *
 *   import { encrypt, decrypt } from "../utils/encryption";
 *   import { createClinicalDataService } from "@mano/domain";
 *   const clinical = createClinicalDataService(encrypt, decrypt);
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EncryptFn = (plaintext: string | null | undefined) => string | null;
type DecryptFn = (ciphertext: string | null | undefined) => string | null;

// ---------------------------------------------------------------------------
// Field lists — single source of truth for which fields are encrypted
// ---------------------------------------------------------------------------

/** Session note string fields that are individually encrypted */
const NOTE_ENCRYPTED_FIELDS = [
  "subjective",
  "objective",
  "assessment",
  "plan",
  "freeform_content",
  "homework",
] as const;

/** Session note array fields that are JSON-serialised then encrypted */
const NOTE_JSON_FIELDS = ["techniques_used", "risk_flags"] as const;

/** Treatment plan string fields that are individually encrypted */
const PLAN_ENCRYPTED_FIELDS = [
  "presenting_concerns",
  "diagnosis",
  "notes",
] as const;

// ---------------------------------------------------------------------------
// Service interface
// ---------------------------------------------------------------------------

export interface ClinicalDataService {
  /** Encrypt session note fields before DB insert */
  encryptNote<T extends Record<string, unknown>>(input: T): T;
  /** Decrypt session note fields after DB select */
  decryptNote<T extends Record<string, unknown>>(note: T): T;

  /** Encrypt treatment plan fields before DB insert */
  encryptPlan<T extends Record<string, unknown>>(input: T): T;
  /** Decrypt treatment plan fields after DB select */
  decryptPlan<T extends Record<string, unknown>>(plan: T): T;

  /** Encrypt message content before DB insert */
  encryptMessage<T extends Record<string, unknown>>(msg: T): T;
  /** Decrypt message content after DB select */
  decryptMessage<T extends Record<string, unknown>>(msg: T): T;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createClinicalDataService(
  encrypt: EncryptFn,
  decrypt: DecryptFn,
): ClinicalDataService {
  // -- helpers ----------------------------------------------------------------

  function encryptStringFields<T extends Record<string, unknown>>(
    obj: T,
    fields: readonly string[],
  ): T {
    const result = { ...obj };
    for (const field of fields) {
      if (field in result && result[field] != null && typeof result[field] === "string") {
        (result as Record<string, unknown>)[field] = encrypt(result[field] as string);
      }
    }
    return result;
  }

  function decryptStringFields<T extends Record<string, unknown>>(
    obj: T,
    fields: readonly string[],
  ): T {
    const result = { ...obj };
    for (const field of fields) {
      if (field in result && result[field] != null && typeof result[field] === "string") {
        try {
          (result as Record<string, unknown>)[field] = decrypt(result[field] as string);
        } catch {
          /* legacy unencrypted data — leave as-is */
        }
      }
    }
    return result;
  }

  // -- public API -------------------------------------------------------------

  return {
    // ── Session notes ──────────────────────────────────────────────────────

    encryptNote<T extends Record<string, unknown>>(input: T): T {
      let result = encryptStringFields(input, NOTE_ENCRYPTED_FIELDS);
      // Encrypt array fields as JSON strings
      for (const field of NOTE_JSON_FIELDS) {
        if (field in result && result[field] != null) {
          (result as Record<string, unknown>)[field] = encrypt(
            JSON.stringify(result[field]),
          );
        }
      }
      return result;
    },

    decryptNote<T extends Record<string, unknown>>(note: T): T {
      let result = decryptStringFields(note, NOTE_ENCRYPTED_FIELDS);
      // Decrypt array fields back from encrypted JSON strings
      for (const field of NOTE_JSON_FIELDS) {
        if (field in result && result[field] != null && typeof result[field] === "string") {
          try {
            const decrypted = decrypt(result[field] as string);
            (result as Record<string, unknown>)[field] = decrypted
              ? JSON.parse(decrypted)
              : result[field];
          } catch {
            /* legacy unencrypted data — leave as-is */
          }
        }
      }
      return result;
    },

    // ── Treatment plans ────────────────────────────────────────────────────

    encryptPlan<T extends Record<string, unknown>>(input: T): T {
      let result = encryptStringFields(input, PLAN_ENCRYPTED_FIELDS);
      if ("goals" in result && result.goals != null) {
        (result as Record<string, unknown>).goals = encrypt(
          JSON.stringify(result.goals),
        );
      }
      return result;
    },

    decryptPlan<T extends Record<string, unknown>>(plan: T): T {
      let result = decryptStringFields(plan, PLAN_ENCRYPTED_FIELDS);
      if ("goals" in result && result.goals != null && typeof result.goals === "string") {
        try {
          const decrypted = decrypt(result.goals as string);
          (result as Record<string, unknown>).goals = decrypted
            ? JSON.parse(decrypted)
            : result.goals;
        } catch {
          /* legacy unencrypted data — leave as-is */
        }
      }
      return result;
    },

    // ── Messages ───────────────────────────────────────────────────────────

    encryptMessage<T extends Record<string, unknown>>(msg: T): T {
      if ("content" in msg && typeof msg.content === "string") {
        return { ...msg, content: encrypt(msg.content as string) };
      }
      return msg;
    },

    decryptMessage<T extends Record<string, unknown>>(msg: T): T {
      if ("content" in msg && typeof msg.content === "string") {
        try {
          const decrypted = decrypt(msg.content as string);
          if (decrypted != null) {
            return { ...msg, content: decrypted };
          }
        } catch {
          /* legacy unencrypted data — leave as-is */
        }
      }
      return msg;
    },
  };
}
