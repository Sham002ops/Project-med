import { Request, Response, NextFunction } from "express";
import { MedplumClient } from "@medplum/core";


// ✅ Middleware helper to initialize Medplum client
const getMedplumClient = (req: Request) => {
  return new MedplumClient({ accessToken: (req.user as any).accessToken });
};

// ---------------------
// Patient Endpoints
// ---------------------

export const createPatient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const medplumUser = getMedplumClient(req);
    const { firstName, lastName, gender, birthDate } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({ error: "First and last names are required." });
    }

    const patient = await medplumUser.createResource({
      resourceType: "Patient",
      name: [{ given: [firstName], family: lastName }],
      gender,
      birthDate,
    });

    res.status(201).json({
      patient,
      patientId: patient.id,
      message: "Patient created successfully",
    });
  } catch (err) {
    next(err);
  }
};

export const getPatient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const medplumUser = getMedplumClient(req);
    const patient = await medplumUser.readResource("Patient", req.params.id);
    res.json(patient);
  } catch (err) {
    next(err);
  }
};

// ---------------------
// Observation Endpoints
// ---------------------

export const createObservation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const medplumUser = getMedplumClient(req);
    const { code, valueBoolean, effectiveDateTime } = req.body;

    const observation = await medplumUser.createResource({
      resourceType: "Observation",
      status: "final",
      code: { coding: [{ system: "http://loinc.org", code }] },
      subject: { reference: `Patient/${req.params.id}` },
      valueBoolean,
      effectiveDateTime: effectiveDateTime || new Date().toISOString(),
    });

    res.status(201).json(observation);
  } catch (err) {
    next(err);
  }
};

// ---------------------
// MedicationRequest Endpoints
// ---------------------

export const createMedicationRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const medplumUser = getMedplumClient(req);
    const { medicationCode, medicationDisplay, intent = "order" } = req.body;

    const medicationRequest = await medplumUser.createResource({
      resourceType: "MedicationRequest",
      intent,
      status: "active",
      medicationCodeableConcept: {
        coding: [{ system: "http://snomed.info/sct", code: medicationCode, display: medicationDisplay }],
      },
      subject: { reference: `Patient/${req.params.id}` },
      authoredOn: new Date().toISOString(),
    });

    res.status(201).json(medicationRequest);
  } catch (err) {
    next(err);
  }
};

export const getMedicationRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const medplumUser = getMedplumClient(req);
    const medRequests = await medplumUser.search("MedicationRequest", {
      subject: `Patient/${req.params.id}`,
    });
    res.json(medRequests);
  } catch (err) {
    next(err);
  }
};

// ---------------------
// CarePlan Endpoints
// ---------------------

export const createCarePlan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const medplumUser = getMedplumClient(req);
    const { description, status = "active" } = req.body;

    const carePlan = await medplumUser.createResource({
      resourceType: "CarePlan",
      status,
      intent: "plan",
      description,
      subject: { reference: `Patient/${req.params.id}` },
      created: new Date().toISOString(),
    });

    res.status(201).json(carePlan);
  } catch (err) {
    next(err);
  }
};

export const getCarePlans = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const medplumUser = getMedplumClient(req);
    const carePlans = await medplumUser.search("CarePlan", {
      subject: `Patient/${req.params.id}`,
    });
    res.json(carePlans);
  } catch (err) {
    next(err);
  }
};
