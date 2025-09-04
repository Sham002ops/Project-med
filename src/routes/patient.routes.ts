import { Router } from "express";
import ensureAuthenticated from "../middlewares/ensureAuthenticated";
import {
  createPatient,
  getPatient,
  createObservation,
  createMedicationRequest,
  getMedicationRequests,
  createCarePlan,
  getCarePlans,
} from "../controllers/patient.controller";

const router = Router();

// ---------------------
// Patient Endpoints
// ---------------------
router.post("/", ensureAuthenticated, createPatient);
router.get("/:id", ensureAuthenticated, getPatient);

// ---------------------
// Observation Endpoints
// ---------------------
router.post("/:id/observation", ensureAuthenticated, createObservation);

// ---------------------
// MedicationRequest Endpoints
// ---------------------
router.post("/:id/medication-request", ensureAuthenticated, createMedicationRequest);
router.get("/:id/medication-requests", ensureAuthenticated, getMedicationRequests);

// ---------------------
// CarePlan Endpoints
// ---------------------
router.post("/:id/careplan", ensureAuthenticated, createCarePlan);
router.get("/:id/careplans", ensureAuthenticated, getCarePlans);

export default router;
