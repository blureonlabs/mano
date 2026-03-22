// Session / slot logic
export { computeAvailableSlots } from "./session/slot-calculator";

// Clinical data encryption/decryption
export {
  createClinicalDataService,
  type ClinicalDataService,
} from "./clinical/clinical-data.service";

// Booking policy rules
export { BookingPolicyService } from "./booking/booking-policy.service";

// Scheduling conflict detection
export {
  ConflictDetectionService,
  type TimeRange,
} from "./scheduling/conflict-detection.service";
