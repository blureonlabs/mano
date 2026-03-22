export const CLIENT_STATUSES = {
  active: { label: "Active", color: "sage" },
  inactive: { label: "Inactive", color: "ink3" },
  terminated: { label: "Terminated", color: "red" },
} as const;

export const CLIENT_TYPES = {
  regular: { label: "Regular", description: "Fixed weekly slot" },
  irregular: { label: "Irregular", description: "Varied timings" },
} as const;

export const CLIENT_CATEGORIES = {
  indian: { label: "Indian", color: "sage" },
  nri: { label: "NRI", color: "blue" },
  couple: { label: "Couple", color: "amber" },
  other: { label: "Other", color: "ink3" },
} as const;

export const PRACTICE_ROLES = {
  owner: { label: "Owner", description: "Full access to everything" },
  therapist: { label: "Therapist", description: "Own calendar, clients, and notes" },
  admin: { label: "Admin", description: "Schedules, clients, bookings — no clinical notes" },
} as const;
