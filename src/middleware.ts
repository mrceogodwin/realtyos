import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Lightweight middleware until Auth.js is fully configured with AUTH_SECRET.
 * When AUTH_SECRET is present, we can switch back to NextAuth(authConfig).auth.
 * For now this keeps the app deployable and leaves room for route protection.
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/health|_next/static|_next/image|favicon.ico).*)"],
};
