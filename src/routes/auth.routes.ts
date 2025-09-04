import { Router } from "express";
import cors from "cors";
import { login, callback, logout } from "../controllers/auth.controller";
import { registerPractitioner } from "../controllers/registerPractitioner";

const router = Router();

// Enable CORS (if needed for frontend communication)
router.use(cors());

// Practitioner registration
router.post("/registerPractitioner", registerPractitioner);

// Medplum auth flow
router.get("/login", login);         // Redirect user to Medplum login
router.get("/callback", callback);   // Handle Medplum callback
router.post("/logout", logout);      // Logout user

export default router;
