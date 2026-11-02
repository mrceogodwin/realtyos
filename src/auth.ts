import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { authConfig } from "./auth.config";
import { queryOne } from "@/lib/db";

type UserRow = { id: string; status: string };

const providers =
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
    ? [Google({
        clientId: process.env.AUTH_GOOGLE_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET,
      })]
    : [];

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ account, profile }) {
      return account?.provider === "google" && profile?.email_verified === true;
    },
    async jwt({ token, account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        const row = await queryOne<UserRow>(
          `INSERT INTO user_profiles
             (auth_provider, auth_subject, email, full_name, avatar_url)
           VALUES ('google', $1, lower($2), $3, $4)
           ON CONFLICT (email)
           DO UPDATE SET
             auth_provider = 'google',
             auth_subject = EXCLUDED.auth_subject,
             full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
             avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
             updated_at = now()
           RETURNING id, status`,
          [account.providerAccountId, String(profile.email), profile.name ?? null, profile.picture ?? null]
        );
        if (!row || row.status !== "active") throw new Error("Account unavailable");
        token.id = row.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.id === "string") session.user.id = token.id;
      return session;
    },
  },
});
