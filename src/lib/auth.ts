import { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "PKL HASSINA",
      credentials: { identifier: { label: "NIS / Email", type: "text" }, password: { label: "Password", type: "password" } },
      async authorize(credentials) {
        const id = (credentials?.identifier ?? "").trim();
        const pw = (credentials?.password ?? "") as string;
        if (!id || !pw) return null;
        const user = await prisma.user.findFirst({ where: { OR: [{ nis: id }, { email: id }] } });
        if (!user) return null;
        const ok = await bcrypt.compare(pw, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, name: user.name, email: user.email ?? `${user.nis}@siswa.local`, role: user.role, nis: user.nis, mustChangePassword: user.mustChangePassword } as unknown as Record<string, unknown> as { id: string; name: string; email: string };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        (token as Record<string, unknown>).role = (user as unknown as { role: string }).role;
        (token as Record<string, unknown>).nis = (user as unknown as { nis: string | null }).nis;
        (token as Record<string, unknown>).mustChangePassword = (user as unknown as { mustChangePassword: boolean }).mustChangePassword;
        (token as Record<string, unknown>).uid = (user as unknown as { id: string }).id;
      }
      return token;
    },
    async session({ session, token }) {
      const t = token as unknown as { role: string; nis: string | null; mustChangePassword: boolean; uid: string };
      (session as unknown as { user: Record<string, unknown> }).user = { ...(session.user as object), role: t.role, nis: t.nis, mustChangePassword: t.mustChangePassword, uid: t.uid };
      return session;
    },
  },
  pages: { signIn: "/login" },
};
