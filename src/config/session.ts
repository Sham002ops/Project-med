import session from "express-session";

export default {
  secret: process.env.SESSION_SECRET || "your_secret_key",
  resave: false,
  saveUninitialized: false,
} as session.SessionOptions;
