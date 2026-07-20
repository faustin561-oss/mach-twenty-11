import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

// Zero-config local preview: `next dev` sets NODE_ENV=development
// automatically (Next.js does this itself, not something we control),
// so this fallback only ever activates for `npm run dev` when AUTH_SECRET
// truly isn't set — never in production, where `next build`/`next start`
// set NODE_ENV=production the same way. The value is fixed (not randomly
// generated per boot) so sessions survive dev-server hot reloads instead
// of forcing a re-login every time a file change restarts the process.
// It is intentionally not a secret — it's checked into source and
// printed in this comment — which is exactly why it must never be used
// outside development.
const INSECURE_DEV_ONLY_SECRET = "dev-only-insecure-fallback-secret-never-use-in-production-3f9a7c2e";

const isProduction = process.env.NODE_ENV === "production";
const authSecret = process.env.AUTH_SECRET || (isProduction ? undefined : INSECURE_DEV_ONLY_SECRET);

if (!process.env.AUTH_SECRET && !isProduction) {
  // Logged once at module load (this file is a singleton import), not
  // per-request — deliberately visible so nobody mistakes this for a
  // real secret, but not a blocker.
  console.warn(
    "\n[auth] AUTH_SECRET is not set — using a fixed, insecure, development-only fallback.\n" +
    "        This is fine for local preview. Set a real AUTH_SECRET before deploying\n" +
    "        anywhere real; see .env.example.\n"
  );
}
if (isProduction && !process.env.AUTH_SECRET) {
  // Genuinely nothing safe to fall back to in production — sessions
  // cannot be signed with a secret that's checked into source and public.
  // scripts/check-env.js already catches this before `next build` in the
  // normal flow; this throw is the last line of defense if that script is
  // ever bypassed.
  throw new Error(
    "AUTH_SECRET is required in production and has no safe fallback. Set a real value — see .env.example."
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  secret: authSecret,
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as any).role;
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as any).role = token.role;
      return session;
    },
  },
});
