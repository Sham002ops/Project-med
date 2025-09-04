import { Request, Response, NextFunction } from "express";
import { MedplumClient } from "@medplum/core";

// Extend express-session types to include accessToken
declare module 'express-session' {
  interface SessionData {
    accessToken?: string;
  }
}

// Initialize Medplum client (server-side)
const medplum = new MedplumClient({
  clientId: process.env.MEDPLUM_CLIENT_ID!,
  clientSecret: process.env.MEDPLUM_CLIENT_SECRET!,
  // redirect: process.env.MEDPLUM_REDIRECT_URI!, // Removed to fix type error
});

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Generate authorization URL for redirect
    const authUrl = medplum.getAuthorizeUrl(); // ✅ renamed from getAuthorizationUrl
    res.redirect(authUrl);
  } catch (err) {
    next(err);
  }
};

export const callback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = req.query.code as string;
    if (!code) {
      return res.status(400).json({ error: "Missing authorization code" });
    }

    // Exchange code for tokens
    await medplum.processCode(code);

    // Store accessToken in session (or cookies)
    req.session!.accessToken = medplum.getAccessToken();

    res.json({ message: "Login successful" });
  } catch (err) {
    next(err);
  }
};

export const logout = (req: Request, res: Response, next: NextFunction) => {
  try {
    req.session?.destroy(() => {
      res.json({ message: "Logged out successfully" });
    });
  } catch (err) {
    next(err);
  }
};
