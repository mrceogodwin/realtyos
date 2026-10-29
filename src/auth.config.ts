import type { NextAuthConfig } from "next-auth";

/**
 * Shared Auth.js configuration.
 * Providers and adapter will be completed once AUTH_SECRET and DATABASE_URL are available.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard =
        request.nextUrl.pathname.startsWith("/dashboard") ||
        request.nextUrl.pathname === "/";
      const isAuthPage =
        request.nextUrl.pathname.startsWith("/login") ||
        request.nextUrl.pathname.startsWith("/onboarding") ||
        request.nextUrl.pathname.startsWith("/api/auth");

      // For now allow everything; tighten once providers are live
      if (isAuthPage) return true;
      if (isOnDashboard) return true; // temporary — will require isLoggedIn
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
