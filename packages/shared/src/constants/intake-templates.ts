import type { IntakeFieldType } from "../schemas/intake-form.schema";

interface TemplateField {
  type: IntakeFieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  agreement_text?: string;
}

function f(
  type: IntakeFieldType,
  label: string,
  overrides?: Omit<TemplateField, "type" | "label">,
): TemplateField {
  return { type, label, ...overrides };
}

export interface IntakeTemplate {
  name: string;
  description: string;
  form_type: string;
  fields: TemplateField[];
}

export const INTAKE_TEMPLATES: Record<string, IntakeTemplate> = {
  individual: {
    name: "Individual Intake Form",
    description: "Standard intake form for individual therapy clients",
    form_type: "individual",
    fields: [
      f("heading", "Personal Information"),
      f("text", "Full Name", { required: true, placeholder: "Your full name" }),
      f("date", "Date of Birth", { required: true }),
      f("text", "Pronouns", { placeholder: "e.g. she/her, he/him, they/them" }),
      f("text", "Address", { placeholder: "City, State" }),
      f("text", "Occupation", { placeholder: "Your current occupation" }),
      f("text", "Emergency Contact Name", { required: true }),
      f("text", "Emergency Contact Phone", { required: true }),
      f("select", "Relationship to Emergency Contact", {
        options: ["Parent", "Spouse/Partner", "Sibling", "Friend", "Other"],
      }),

      f("heading", "Therapy History"),
      f("yes_no", "Have you been in therapy before?"),
      f("textarea", "If yes, please describe your previous therapy experience", {
        placeholder: "Duration, type of therapy, what was helpful...",
      }),
      f("yes_no", "Are you currently taking any medication?"),
      f("textarea", "If yes, please list medications and dosages"),

      f("heading", "Current Concerns"),
      f("textarea", "What brings you to therapy?", {
        required: true,
        placeholder: "Please describe what you'd like to work on...",
      }),
      f("multi_select", "Are you currently experiencing any of the following?", {
        options: [
          "Anxiety", "Depression", "Relationship issues", "Work stress",
          "Grief/Loss", "Trauma", "Sleep difficulties", "Anger management",
          "Self-esteem issues", "Life transitions", "Other",
        ],
      }),
      f("select", "How would you rate your current distress level?", {
        required: true,
        options: ["1 - Minimal", "2 - Mild", "3 - Moderate", "4 - Severe", "5 - Extreme"],
      }),

      f("heading", "Consent & Agreement"),
      f("consent", "Confidentiality Agreement", {
        required: true,
        agreement_text:
          "I understand that all information shared during therapy sessions is confidential " +
          "and will not be disclosed without my written consent, except where required by law " +
          "(e.g., risk of harm to self or others, child abuse, court order). " +
          "I understand and agree to these terms.",
      }),
      f("consent", "Cancellation Policy", {
        required: true,
        agreement_text:
          "I understand that I must provide at least 24 hours' notice to cancel or " +
          "reschedule an appointment. Late cancellations or no-shows may be charged " +
          "the full session fee. I understand and agree to this policy.",
      }),
    ],
  },

  couples: {
    name: "Couples Intake Form",
    description: "Intake form for couples therapy",
    form_type: "couples",
    fields: [
      f("heading", "Partner 1 Information"),
      f("text", "Partner 1 - Full Name", { required: true }),
      f("date", "Partner 1 - Date of Birth", { required: true }),
      f("text", "Partner 1 - Pronouns"),
      f("text", "Partner 1 - Occupation"),
      f("text", "Partner 1 - Phone", { required: true }),
      f("text", "Partner 1 - Email", { required: true }),

      f("heading", "Partner 2 Information"),
      f("text", "Partner 2 - Full Name", { required: true }),
      f("date", "Partner 2 - Date of Birth", { required: true }),
      f("text", "Partner 2 - Pronouns"),
      f("text", "Partner 2 - Occupation"),
      f("text", "Partner 2 - Phone", { required: true }),
      f("text", "Partner 2 - Email"),

      f("heading", "Relationship Details"),
      f("select", "Relationship Status", {
        required: true,
        options: ["Dating", "Engaged", "Married", "Living together", "Separated", "Other"],
      }),
      f("text", "How long have you been together?", { required: true }),
      f("yes_no", "Do you have children together?"),
      f("text", "If yes, ages of children"),

      f("heading", "Therapy Goals"),
      f("textarea", "What brings you both to couples therapy?", {
        required: true,
        placeholder: "Please describe the main concerns you'd like to address...",
      }),
      f("multi_select", "Areas you'd like to work on", {
        options: [
          "Communication", "Trust", "Intimacy", "Conflict resolution",
          "Parenting", "Financial issues", "Infidelity", "Life transitions",
          "In-law relationships", "Division of responsibilities", "Other",
        ],
      }),
      f("yes_no", "Have you attended couples therapy before?"),

      f("heading", "Consent & Agreement"),
      f("consent", "Confidentiality Agreement", {
        required: true,
        agreement_text:
          "I understand that couples therapy involves both partners. " +
          "The therapist will not keep secrets shared individually by one partner " +
          "from the other partner, unless safety concerns arise. " +
          "All information shared is confidential and will not be disclosed " +
          "without written consent from both partners. I understand and agree.",
      }),
      f("consent", "Cancellation Policy", {
        required: true,
        agreement_text:
          "I understand that cancellations must be made at least 24 hours in advance. " +
          "Late cancellations or no-shows may be charged the full session fee.",
      }),
    ],
  },

  child: {
    name: "Child/Adolescent Intake Form",
    description: "Intake form for child and adolescent therapy (filled by parent/guardian)",
    form_type: "child",
    fields: [
      f("heading", "Child's Information"),
      f("text", "Child's Full Name", { required: true }),
      f("date", "Child's Date of Birth", { required: true }),
      f("text", "Child's Pronouns"),
      f("text", "School Name"),
      f("text", "Grade/Standard"),

      f("heading", "Parent/Guardian Information"),
      f("text", "Parent/Guardian Full Name", { required: true }),
      f("select", "Relationship to Child", {
        required: true,
        options: ["Mother", "Father", "Stepmother", "Stepfather", "Guardian", "Other"],
      }),
      f("text", "Phone", { required: true }),
      f("text", "Email", { required: true }),
      f("text", "Emergency Contact (if different)"),

      f("heading", "Family & Home"),
      f("select", "Custody Arrangement", {
        options: ["Both parents together", "Joint custody", "Single parent", "Guardian", "Other"],
      }),
      f("text", "Siblings (names and ages)"),
      f("textarea", "Any significant family changes recently?", {
        placeholder: "Divorce, relocation, loss, new sibling, etc.",
      }),

      f("heading", "Concerns"),
      f("textarea", "What brings your child to therapy?", {
        required: true,
        placeholder: "Please describe your main concerns...",
      }),
      f("multi_select", "Areas of concern", {
        options: [
          "Anxiety", "Behavioural issues", "School performance", "Social skills",
          "Bullying", "Family changes", "Trauma", "Grief/Loss",
          "ADHD/Attention", "Anger", "Self-harm", "Other",
        ],
      }),
      f("yes_no", "Has your child been in therapy before?"),
      f("yes_no", "Has your child been diagnosed with any conditions?"),
      f("textarea", "If yes, please describe diagnoses and current treatment"),

      f("heading", "Consent"),
      f("consent", "Parental Consent", {
        required: true,
        agreement_text:
          "As the parent/legal guardian, I consent to my child receiving therapy services. " +
          "I understand that while therapy details are confidential, the therapist may " +
          "share general progress updates with me. The therapist is obligated to break " +
          "confidentiality if there is a risk of harm to the child or others.",
      }),
      f("consent", "Cancellation Policy", {
        required: true,
        agreement_text:
          "I understand that cancellations must be made at least 24 hours in advance. " +
          "Late cancellations or no-shows may be charged the full session fee.",
      }),
    ],
  },

  family: {
    name: "Family Therapy Intake Form",
    description: "Intake form for family therapy sessions",
    form_type: "family",
    fields: [
      f("heading", "Primary Contact"),
      f("text", "Your Full Name", { required: true }),
      f("text", "Phone", { required: true }),
      f("text", "Email", { required: true }),
      f("select", "Your Role in the Family", {
        required: true,
        options: ["Parent", "Grandparent", "Adult child", "Spouse", "Other"],
      }),

      f("heading", "Family Members Attending"),
      f("textarea", "List all family members who will attend therapy", {
        required: true,
        placeholder: "Name, age, and relationship for each family member...",
      }),
      f("text", "Total number of family members attending"),

      f("heading", "Family Background"),
      f("select", "Family Structure", {
        options: ["Nuclear family", "Joint family", "Single parent", "Blended family", "Other"],
      }),
      f("textarea", "Any recent significant changes in the family?", {
        placeholder: "Relocation, loss, divorce, illness, financial changes, etc.",
      }),

      f("heading", "Therapy Goals"),
      f("textarea", "What brings your family to therapy?", {
        required: true,
        placeholder: "Please describe the main issues you'd like to address...",
      }),
      f("multi_select", "Areas of concern", {
        options: [
          "Communication", "Conflict resolution", "Parenting challenges",
          "Sibling rivalry", "Blended family adjustment", "Grief/Loss",
          "Behavioural issues (child)", "Generational conflicts",
          "Life transitions", "Trust issues", "Other",
        ],
      }),
      f("yes_no", "Has your family attended therapy before?"),

      f("heading", "Consent"),
      f("consent", "Family Therapy Agreement", {
        required: true,
        agreement_text:
          "I understand that family therapy involves multiple family members. " +
          "All members are expected to participate actively and respectfully. " +
          "Information shared in therapy is confidential. The therapist may " +
          "recommend individual sessions alongside family sessions. " +
          "I understand and agree to these terms.",
      }),
      f("consent", "Cancellation Policy", {
        required: true,
        agreement_text:
          "I understand that cancellations must be made at least 24 hours in advance. " +
          "Late cancellations or no-shows may be charged the full session fee.",
      }),
    ],
  },
};

export type IntakeTemplateKey = keyof typeof INTAKE_TEMPLATES;
export const INTAKE_TEMPLATE_KEYS = Object.keys(INTAKE_TEMPLATES) as IntakeTemplateKey[];
