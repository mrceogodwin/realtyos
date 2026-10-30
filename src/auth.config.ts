import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      const isPublicAuthRoute =
        path.startsWith("/login") ||
        path.startsWith("/onboarding") ||
        path.startsWith("/api/auth");
      if (isPublicAuthRoute) return true;

      const isProtectedRoute =
        path === "/app" ||
        path.startsWith("/app/") ||
        path === "/admin" ||
        path.startsWith("/admin/");
      if (isProtectedRoute) return Boolean(auth?.user);

      return true;
    },
    jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.id === "string") {
        session.user.id = token.id;
      }
      return session;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
