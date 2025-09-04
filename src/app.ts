import express from "express";
import session from "express-session";
import passport from "passport";
import authRoutes from "./routes/auth.routes";
import patientRoutes from "./routes/patient.routes";

import errorHandler from "./middlewares/errorHandler";
import configurePassport from "./config/passport";
import sessionConfig from "./config/session";
import "dotenv/config";

const app = express();
app.use(express.json());

// Session + Passport
app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());
configurePassport(passport);

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use("/auth", authRoutes);
app.use("/patients", patientRoutes);


// Error handler
app.use(errorHandler);

export default app;
