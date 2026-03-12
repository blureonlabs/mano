export const SESSION_DURATIONS = [15, 20, 30, 45, 50, 60, 90, 120] as const;
export type SessionDuration = (typeof SESSION_DURATIONS)[number];

export const DEFAULT_SESSION_TYPES = [
  {
    name: "Intro Call",
    duration_mins: 15,
    rate_inr: 0,
    description: "A free introductory call to see if we are a good fit.",
    is_active: true,
    sort_order: 0,
  },
  {
    name: "Regular Session",
    duration_mins: 50,
    rate_inr: 0,
    description: null,
    is_active: true,
    sort_order: 1,
  },
] as const;

export const SESSION_STATUSES = {
  scheduled: { label: "Scheduled", color: "sage" },
  completed: { label: "Completed", color: "ink3" },
  cancelled: { label: "Cancelled", color: "amber" },
  no_show: { label: "No Show", color: "red" },
} as const;

export const PAYMENT_STATUSES = {
  pending: { label: "Pending", color: "amber" },
  paid: { label: "Paid", color: "sage" },
  refunded: { label: "Refunded", color: "ink3" },
  waived: { label: "Waived", color: "ink3" },
} as const;

export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;
