export const PRICING_TIERS = {
  free: {
    name: "Free",
    price_inr: 0,
    max_clients: 5,
    features: [
      "Personal booking page",
      "Basic scheduling",
      "Up to 5 active clients",
    ],
  },
  starter: {
    name: "Starter",
    price_inr: 99900, // ₹999 in paise
    max_clients: 30,
    features: [
      "Personal booking page",
      "Up to 30 active clients",
      "UPI + Razorpay payments",
      "Auto-invoicing",
      "Session notes",
      "Automated reminders",
    ],
  },
  pro: {
    name: "Pro",
    price_inr: 199900, // ₹1,999 in paise
    max_clients: null, // unlimited
    features: [
      "Everything in Starter",
      "Unlimited active clients",
      "Zoom / Meet integration",
      "Secure client messaging",
      "Intake forms",
      "Package billing",
      "Priority support",
    ],
  },
  clinic: {
    name: "Clinic",
    price_inr: 499900, // ₹4,999 in paise
    max_clients: null,
    features: [
      "Everything in Pro",
      "Up to 10 therapists",
      "Admin dashboard",
      "Multi-therapist scheduling",
      "Consolidated billing",
      "Custom note templates",
      "Audit logs",
      "Dedicated support",
    ],
  },
} as const;

export type PricingTier = keyof typeof PRICING_TIERS;
