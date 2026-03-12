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
});

export type AppRouter = typeof appRouter;
