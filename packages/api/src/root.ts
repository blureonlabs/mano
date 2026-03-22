import { router } from "./trpc";
import { therapistRouter } from "./routers/therapist";
import { clientRouter } from "./routers/client";
import { sessionRouter } from "./routers/session";
import { bookingRouter } from "./routers/booking";
import { paymentRouter } from "./routers/payment";
import { messageRouter } from "./routers/message";
import { integrationRouter } from "./routers/integration";
import { treatmentPlanRouter } from "./routers/treatment-plan";
import { resourceRouter } from "./routers/resource";
import { blockedSlotRouter } from "./routers/blocked-slot";
import { recurringReservationRouter } from "./routers/recurring-reservation";
import { practiceRouter } from "./routers/practice";
import { broadcastRouter } from "./routers/broadcast";
import { intakeFormRouter } from "./routers/intake-form";
import { clientPortalRouter } from "./routers/client-portal";
import { onboardingRouter } from "./routers/onboarding";
import { sessionTypeRouter } from "./routers/session-type";
import { analyticsRouter } from "./routers/analytics";

export const appRouter = router({
  therapist: therapistRouter,
  clients: clientRouter,
  session: sessionRouter,
  booking: bookingRouter,
  payment: paymentRouter,
  message: messageRouter,
  integration: integrationRouter,
  treatmentPlan: treatmentPlanRouter,
  resource: resourceRouter,
  blockedSlot: blockedSlotRouter,
  recurringReservation: recurringReservationRouter,
  practice: practiceRouter,
  broadcast: broadcastRouter,
  intakeForm: intakeFormRouter,
  clientPortal: clientPortalRouter,
  onboarding: onboardingRouter,
  sessionType: sessionTypeRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;
