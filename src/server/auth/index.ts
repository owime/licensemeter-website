/**
 * Auth module: MSAL handles the Microsoft leg (see ./msal), jose-signed
 * cookies hold the session (see ./session). Route handlers under
 * src/app/api/auth/* drive sign-in, callback, demo entry and sign-out.
 */
export { auth, clearSessionCookie } from "./session";
export type { Session, SessionUser } from "./session";
