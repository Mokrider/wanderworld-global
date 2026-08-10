import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * JWT sessions, no NextAuth Prisma adapter. Deliberate: the adapter wants
 * its own Account/Session/VerificationToken tables, which we don't need
 * for Google + credentials auth. Instead, the callbacks below upsert into
 * our own `User` model directly — the same one guest checkout writes to
 * (see lib/bookings.ts findOrCreateGuestUser). That means a Google
 * sign-in and a guest booking made with the same email resolve to the
 * same User row automatically, no separate linking step required.
 */
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Keyed by email, not IP — the thing worth stopping is repeated
        // guesses against one account, regardless of which IP they come
        // from. See lib/rate-limit.ts for the serverless caveat.
        const rateLimit = checkRateLimit(`login:${credentials.email.toLowerCase()}`, {
          limit: 5,
          windowMs: 15 * 60_000,
        });
        if (!rateLimit.allowed) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name ?? undefined };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        await prisma.user.upsert({
          where: { email: user.email },
          update: { name: user.name ?? undefined, image: user.image ?? undefined },
          create: { email: user.email, name: user.name ?? undefined, image: user.image ?? undefined },
        });
      }
      return true;
    },
    async jwt({ token, user }) {
      // On initial sign-in, `user` is populated — look up (or the Google
      // callback above has just created) our own User row and stamp its
      // id onto the token so every later request has it for free.
      const email = user?.email ?? token.email;
      if (email && !token.userId) {
        const dbUser = await prisma.user.findUnique({ where: { email } });
        if (dbUser) {
          token.userId = dbUser.id;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        session.user.id = token.userId;
        session.user.role = token.role ?? "CUSTOMER";
      }
      return session;
    },
  },
};
