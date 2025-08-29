import express from "express";
import session from 'express-session';
import passport from 'passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import { MedplumClient } from "@medplum/core";
import dotenv from "dotenv";
dotenv.config();


const app = express();
app.use(express.json());

// Medplum client
const medplum = new MedplumClient({
  baseUrl: process.env.MEDPLUM_BASE_URL || "https://api.medplum.com",
  clientId: process.env.MEDPLUM_CLIENT_ID as string,
  clientSecret: process.env.MEDPLUM_CLIENT_SECRET as string,
});

app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});






// Updated OAuth2 verify callback to include accessToken in user object
passport.use('medplum', new OAuth2Strategy({
  authorizationURL: 'https://auth.medplum.com/oauth2/authorize',
  tokenURL: 'https://auth.medplum.com/oauth2/token',
  clientID: process.env.MEDPLUM_CLIENT_ID!,
  clientSecret: process.env.MEDPLUM_CLIENT_SECRET!,
  callbackURL: 'http://localhost:4000/auth/callback',
},
async (accessToken, refreshToken, params, profile, done) => {
  // Optionally fetch full user profile from Medplum here
  // For now just pass tokens
  done(null, { accessToken, refreshToken });
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj: any, done) => done(null, obj));

// Redirect user to Medplum login
app.get('/auth/login', passport.authenticate('medplum', { scope: ['openid', 'profile', 'email'] }));

// Handle OAuth 2.0 callback redirect
app.get('/auth/callback', passport.authenticate('medplum', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication
    res.redirect('/'); // Redirect to your app's main page
  }
);

// Middleware to protect API routes
function ensureAuthenticated(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
}


// Example: Create Patient in Medplum
app.post("/patient", ensureAuthenticated, async (req, res, next) => {
  try {
    const { firstName, lastName, gender, birthDate } = req.body;
    if (!firstName || !lastName) {
      return res.status(400).json({ error: "First and last names are required." });
    }
    const patient = await medplum.createResource({
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
});

app.get("/patient/:id", async (req, res, next) => {
  try {
    const patient = await medplum.readResource("Patient", req.params.id);
    res.json(patient);
  } catch (err) {
    next(err);
  }
});


app.post("/patient/:id/observation", async (req, res, next) => {
  try {
    const { code, valueBoolean, effectiveDateTime } = req.body;
    const observation = await medplum.createResource({
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
});


app.post("/patient/:id/medication-request", async (req, res, next) => {
  try {
    const { medicationCode, medicationDisplay, intent = "order" } = req.body;
    const medicationRequest = await medplum.createResource({
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
});

app.get("/patient/:id/medication-requests", async (req, res, next) => {
  try {
    const medRequests = await medplum.search("MedicationRequest", { subject: `Patient/${req.params.id}` });
    res.json(medRequests);
  } catch (err) {
    next(err);
  }
});


app.post("/patient/:id/careplan", async (req, res, next) => {
  try {
    const { description, status = "active" } = req.body;
    const carePlan = await medplum.createResource({
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
});

app.get("/patient/:id/careplans", async (req, res, next) => {
  try {
    const carePlans = await medplum.search("CarePlan", { subject: `Patient/${req.params.id}` });
    res.json(carePlans);
  } catch (err) {
    next(err);
  }
});


app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});


console.log('Client ID:', process.env.MEDPLUM_CLIENT_ID);
console.log('Client Secret:', process.env.MEDPLUM_CLIENT_SECRET);


app.listen(4000, () => console.log("Server running on port 4000"));

