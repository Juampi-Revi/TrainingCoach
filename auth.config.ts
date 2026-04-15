import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        });

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string, 
          user.passwordHash
        );

        if (!isValid) return null;

        if (user.role === "client" && user.billingStatus === "due") {
          throw new Error("payment_due");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          role: user.role,
          billingStatus: user.billingStatus
        };
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.billingStatus = (user as { billingStatus?: string }).billingStatus;
      } else if (token.id && token.role === "client") {
        const current = await prisma.user.findFirst({
          where: { id: token.id as string, role: "client" },
          select: { billingStatus: true },
        });
        token.billingStatus = current?.billingStatus ?? "good";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.billingStatus = (token.billingStatus as string) || "good";
      }
      return session;
    },
  }
};
