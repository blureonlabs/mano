export const THERAPY_MODALITIES = {
  cbt: { name: "CBT", fullName: "Cognitive Behavioral Therapy" },
  rebt: { name: "REBT", fullName: "Rational Emotive Behavior Therapy" },
  dbt: { name: "DBT", fullName: "Dialectical Behavior Therapy" },
  psychodynamic: { name: "Psychodynamic", fullName: "Psychodynamic Therapy" },
  humanistic: { name: "Humanistic", fullName: "Humanistic Therapy" },
  gestalt: { name: "Gestalt", fullName: "Gestalt Therapy" },
  act: { name: "ACT", fullName: "Acceptance and Commitment Therapy" },
  emdr: { name: "EMDR", fullName: "Eye Movement Desensitization and Reprocessing" },
  solution_focused: { name: "SFBT", fullName: "Solution-Focused Brief Therapy" },
  integrative: { name: "Integrative", fullName: "Integrative/Eclectic Therapy" },
  other: { name: "Other", fullName: "Other" },
} as const;

export type TherapyModalityKey = keyof typeof THERAPY_MODALITIES;
