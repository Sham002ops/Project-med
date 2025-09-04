import { Strategy as OAuth2Strategy } from "passport-oauth2";
import { PassportStatic } from "passport";

export default function configurePassport(passport: PassportStatic) {
  passport.use("medplum", new OAuth2Strategy({
    authorizationURL: "https://auth.medplum.com/oauth2/authorize",
    tokenURL: "https://auth.medplum.com/oauth2/token",
    clientID: process.env.MEDPLUM_CLIENT_ID!,
    clientSecret: process.env.MEDPLUM_CLIENT_SECRET!,
    callbackURL: "http://localhost:4000/auth/callback",
  }, async (accessToken, refreshToken, params, profile, done) => {
    done(null, { accessToken, refreshToken });
  }));

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((obj: any, done) => done(null, obj));
}
