import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

/**
 * Auth.js (NextAuth v5) instance.
 * Credentials / OAuth providers and the Postgres adapter will be added
 * once AUTH_SECRET and a working DATABASE_URL are configured.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // providers will be registered here
  // adapter will be registered here when using database sessions
});
