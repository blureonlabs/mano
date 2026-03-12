export const NOTE_TEMPLATES = {
  soap: {
    name: "SOAP",
    description: "Subjective, Objective, Assessment, Plan",
    fields: [
      { key: "subjective", label: "Subjective", placeholder: "Client's reported experiences, feelings, concerns..." },
      { key: "objective", label: "Objective", placeholder: "Therapist's observations, behaviors noted, affect..." },
      { key: "assessment", label: "Assessment", placeholder: "Clinical assessment, progress toward goals..." },
      { key: "plan", label: "Plan", placeholder: "Treatment plan, next session focus, homework..." },
    ],
  },
  dap: {
    name: "DAP",
    description: "Data, Assessment, Plan",
    fields: [
      { key: "subjective", label: "Data", placeholder: "Session data — what was discussed, observed..." },
      { key: "assessment", label: "Assessment", placeholder: "Clinical assessment, interpretation..." },
      { key: "plan", label: "Plan", placeholder: "Treatment plan, interventions, next steps..." },
    ],
  },
  birp: {
    name: "BIRP",
    description: "Behavior, Intervention, Response, Plan",
    fields: [
      { key: "subjective", label: "Behavior", placeholder: "Client's presenting behavior, mood, affect..." },
      { key: "objective", label: "Intervention", placeholder: "Therapeutic interventions used during session..." },
      { key: "assessment", label: "Response", placeholder: "Client's response to interventions..." },
      { key: "plan", label: "Plan", placeholder: "Plan for next session, homework, referrals..." },
    ],
  },
  freeform: {
    name: "Free-form",
    description: "Open notes format",
    fields: [
      { key: "freeform_content", label: "Notes", placeholder: "Write your session notes..." },
    ],
  },
} as const;

export type NoteTemplate = keyof typeof NOTE_TEMPLATES;

export const COMMON_TECHNIQUES = [
  "Cognitive Restructuring",
  "Behavioral Activation",
  "Exposure Therapy",
  "Mindfulness",
  "Relaxation Training",
  "Psychoeducation",
  "Motivational Interviewing",
  "Journaling",
  "Role Play",
  "Guided Imagery",
  "EMDR",
  "Grounding Exercises",
  "Socratic Questioning",
  "Thought Records",
  "Activity Scheduling",
] as const;

export const RISK_FLAGS = [
  "Suicidal ideation",
  "Self-harm",
  "Substance abuse",
  "Medication non-compliance",
  "Deteriorating condition",
  "Safety concern",
] as const;
