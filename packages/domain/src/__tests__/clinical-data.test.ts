import { describe, it, expect } from "vitest";
import { createClinicalDataService } from "../clinical/clinical-data.service";

// Mock encrypt/decrypt that are easy to reason about
const mockEncrypt = (s: string | null | undefined): string | null => {
  if (s == null) return null;
  return `ENC:${s}`;
};

const mockDecrypt = (s: string | null | undefined): string | null => {
  if (s == null) return null;
  return s.startsWith("ENC:") ? s.slice(4) : s;
};

const clinical = createClinicalDataService(mockEncrypt, mockDecrypt);

describe("ClinicalDataService", () => {
  describe("encryptNote", () => {
    it("encrypts text fields", () => {
      const input = {
        subjective: "Patient reports anxiety",
        objective: "Observed fidgeting",
        assessment: "GAD likely",
        plan: "Start CBT",
        freeform_content: "Additional notes",
        homework: "Practice breathing",
      };

      const result = clinical.encryptNote(input);

      expect(result.subjective).toBe("ENC:Patient reports anxiety");
      expect(result.objective).toBe("ENC:Observed fidgeting");
      expect(result.assessment).toBe("ENC:GAD likely");
      expect(result.plan).toBe("ENC:Start CBT");
      expect(result.freeform_content).toBe("ENC:Additional notes");
      expect(result.homework).toBe("ENC:Practice breathing");
    });

    it("encrypts JSON fields (techniques_used, risk_flags)", () => {
      const input = {
        techniques_used: ["CBT", "Mindfulness"],
        risk_flags: ["suicidal_ideation"],
      };

      const result = clinical.encryptNote(input);

      // Arrays should be JSON-serialized then encrypted
      expect(result.techniques_used).toBe('ENC:["CBT","Mindfulness"]');
      expect(result.risk_flags).toBe('ENC:["suicidal_ideation"]');
    });

    it("leaves non-encrypted fields untouched", () => {
      const input = {
        id: "abc-123",
        session_id: "sess-456",
        therapist_id: "ther-789",
        subjective: "test",
        created_at: "2026-03-23T10:00:00Z",
      };

      const result = clinical.encryptNote(input);

      expect(result.id).toBe("abc-123");
      expect(result.session_id).toBe("sess-456");
      expect(result.therapist_id).toBe("ther-789");
      expect(result.created_at).toBe("2026-03-23T10:00:00Z");
      expect(result.subjective).toBe("ENC:test");
    });

    it("handles null/undefined fields gracefully", () => {
      const input = {
        subjective: null,
        objective: undefined,
        assessment: "present",
        techniques_used: null,
      };

      const result = clinical.encryptNote(input);

      // null/undefined fields should be left as-is (not encrypted)
      expect(result.subjective).toBeNull();
      expect(result.objective).toBeUndefined();
      expect(result.assessment).toBe("ENC:present");
      expect(result.techniques_used).toBeNull();
    });
  });

  describe("decryptNote", () => {
    it("decrypts text fields", () => {
      const encrypted = {
        subjective: "ENC:Patient reports anxiety",
        objective: "ENC:Observed fidgeting",
        assessment: "ENC:GAD likely",
        plan: "ENC:Start CBT",
        freeform_content: "ENC:Additional notes",
        homework: "ENC:Practice breathing",
      };

      const result = clinical.decryptNote(encrypted);

      expect(result.subjective).toBe("Patient reports anxiety");
      expect(result.objective).toBe("Observed fidgeting");
      expect(result.assessment).toBe("GAD likely");
      expect(result.plan).toBe("Start CBT");
      expect(result.freeform_content).toBe("Additional notes");
      expect(result.homework).toBe("Practice breathing");
    });

    it("decrypts JSON fields back to arrays", () => {
      const encrypted = {
        techniques_used: 'ENC:["CBT","Mindfulness"]',
        risk_flags: 'ENC:["suicidal_ideation"]',
      };

      const result = clinical.decryptNote(encrypted);

      expect(result.techniques_used).toEqual(["CBT", "Mindfulness"]);
      expect(result.risk_flags).toEqual(["suicidal_ideation"]);
    });

    it("handles legacy unencrypted data (leaves as-is)", () => {
      const legacy = {
        subjective: "Plain text note",
        objective: "Not encrypted",
      };

      // mockDecrypt handles non-ENC: prefix by returning as-is
      const result = clinical.decryptNote(legacy);

      expect(result.subjective).toBe("Plain text note");
      expect(result.objective).toBe("Not encrypted");
    });

    it("round-trips encrypt then decrypt for notes", () => {
      const original = {
        subjective: "Patient reports anxiety",
        objective: "Observed fidgeting",
        assessment: "GAD likely",
        plan: "Start CBT",
        freeform_content: "Additional notes here",
        homework: "Practice breathing exercises",
        techniques_used: ["CBT", "Mindfulness", "Grounding"],
        risk_flags: ["self_harm"],
        id: "note-123",
        session_id: "sess-456",
      };

      const encrypted = clinical.encryptNote(original);
      const decrypted = clinical.decryptNote(encrypted);

      expect(decrypted.subjective).toBe(original.subjective);
      expect(decrypted.objective).toBe(original.objective);
      expect(decrypted.assessment).toBe(original.assessment);
      expect(decrypted.plan).toBe(original.plan);
      expect(decrypted.freeform_content).toBe(original.freeform_content);
      expect(decrypted.homework).toBe(original.homework);
      expect(decrypted.techniques_used).toEqual(original.techniques_used);
      expect(decrypted.risk_flags).toEqual(original.risk_flags);
      expect(decrypted.id).toBe(original.id);
      expect(decrypted.session_id).toBe(original.session_id);
    });
  });

  describe("encryptPlan / decryptPlan", () => {
    it("encrypts presenting_concerns, diagnosis, notes, and goals", () => {
      const input = {
        presenting_concerns: "Anxiety and depression",
        diagnosis: "F41.1 Generalized anxiety disorder",
        notes: "Treatment plan notes",
        goals: [
          { description: "Reduce anxiety", target_date: "2026-06-01" },
          { description: "Improve sleep", target_date: "2026-07-01" },
        ],
      };

      const result = clinical.encryptPlan(input);

      expect(result.presenting_concerns).toBe("ENC:Anxiety and depression");
      expect(result.diagnosis).toBe("ENC:F41.1 Generalized anxiety disorder");
      expect(result.notes).toBe("ENC:Treatment plan notes");
      // goals should be JSON-serialized then encrypted
      expect(typeof result.goals).toBe("string");
      expect((result.goals as unknown as string).startsWith("ENC:")).toBe(true);
    });

    it("decrypts presenting_concerns, diagnosis, notes, and goals", () => {
      const goals = [
        { description: "Reduce anxiety", target_date: "2026-06-01" },
      ];
      const encrypted = {
        presenting_concerns: "ENC:Anxiety and depression",
        diagnosis: "ENC:F41.1 GAD",
        notes: "ENC:Plan notes",
        goals: `ENC:${JSON.stringify(goals)}`,
      };

      const result = clinical.decryptPlan(encrypted);

      expect(result.presenting_concerns).toBe("Anxiety and depression");
      expect(result.diagnosis).toBe("F41.1 GAD");
      expect(result.notes).toBe("Plan notes");
      expect(result.goals).toEqual(goals);
    });

    it("round-trips encrypt then decrypt for plans", () => {
      const original = {
        presenting_concerns: "Chronic anxiety",
        diagnosis: "F41.1",
        notes: "Started on 2026-01-15",
        goals: [{ description: "Reduce panic attacks", status: "in_progress" }],
        id: "plan-123",
        therapist_id: "ther-456",
      };

      const encrypted = clinical.encryptPlan(original);
      const decrypted = clinical.decryptPlan(encrypted);

      expect(decrypted.presenting_concerns).toBe(original.presenting_concerns);
      expect(decrypted.diagnosis).toBe(original.diagnosis);
      expect(decrypted.notes).toBe(original.notes);
      expect(decrypted.goals).toEqual(original.goals);
      expect(decrypted.id).toBe(original.id);
      expect(decrypted.therapist_id).toBe(original.therapist_id);
    });

    it("handles null fields in plans", () => {
      const input = {
        presenting_concerns: null,
        diagnosis: "F41.1",
        notes: undefined,
        goals: null,
      };

      const result = clinical.encryptPlan(input);

      expect(result.presenting_concerns).toBeNull();
      expect(result.diagnosis).toBe("ENC:F41.1");
      expect(result.notes).toBeUndefined();
      expect(result.goals).toBeNull();
    });
  });

  describe("encryptMessage / decryptMessage", () => {
    it("encrypts the content field", () => {
      const msg = {
        id: "msg-123",
        content: "Hello, how are you feeling?",
        sender_id: "ther-456",
        created_at: "2026-03-23T10:00:00Z",
      };

      const result = clinical.encryptMessage(msg);

      expect(result.content).toBe("ENC:Hello, how are you feeling?");
    });

    it("decrypts the content field", () => {
      const msg = {
        id: "msg-123",
        content: "ENC:Hello, how are you feeling?",
        sender_id: "ther-456",
      };

      const result = clinical.decryptMessage(msg);

      expect(result.content).toBe("Hello, how are you feeling?");
    });

    it("leaves other fields untouched when encrypting", () => {
      const msg = {
        id: "msg-123",
        content: "Secret message",
        sender_id: "ther-456",
        created_at: "2026-03-23T10:00:00Z",
        read: false,
      };

      const result = clinical.encryptMessage(msg);

      expect(result.id).toBe("msg-123");
      expect(result.sender_id).toBe("ther-456");
      expect(result.created_at).toBe("2026-03-23T10:00:00Z");
      expect(result.read).toBe(false);
      expect(result.content).toBe("ENC:Secret message");
    });

    it("leaves other fields untouched when decrypting", () => {
      const msg = {
        id: "msg-123",
        content: "ENC:Secret message",
        sender_id: "ther-456",
        created_at: "2026-03-23T10:00:00Z",
        read: true,
      };

      const result = clinical.decryptMessage(msg);

      expect(result.id).toBe("msg-123");
      expect(result.sender_id).toBe("ther-456");
      expect(result.created_at).toBe("2026-03-23T10:00:00Z");
      expect(result.read).toBe(true);
      expect(result.content).toBe("Secret message");
    });

    it("round-trips encrypt then decrypt for messages", () => {
      const original = {
        id: "msg-001",
        content: "Confidential session reminder",
        sender_id: "ther-123",
      };

      const encrypted = clinical.encryptMessage(original);
      const decrypted = clinical.decryptMessage(encrypted);

      expect(decrypted).toEqual(original);
    });

    it("handles message without content field", () => {
      const msg = { id: "msg-123", sender_id: "ther-456" };

      const encrypted = clinical.encryptMessage(msg);
      expect(encrypted).toEqual(msg);

      const decrypted = clinical.decryptMessage(msg);
      expect(decrypted).toEqual(msg);
    });

    it("handles non-string content (does not encrypt)", () => {
      const msg = { id: "msg-123", content: 12345 };

      const encrypted = clinical.encryptMessage(msg);
      expect(encrypted.content).toBe(12345);
    });
  });
});
