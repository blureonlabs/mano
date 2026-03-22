/**
 * Pre-wired ClinicalDataService instance for use in API routers.
 * Injects the concrete encrypt/decrypt functions from this package.
 */
import { createClinicalDataService } from "@mano/domain";
import { encrypt, decrypt } from "./encryption";

export const clinicalData = createClinicalDataService(encrypt, decrypt);
