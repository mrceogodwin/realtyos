import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // Match all routes except static assets and the health endpoint
  matcher: ["/((?!api/health|_next/static|_next/image|favicon.ico).*)"],
};
