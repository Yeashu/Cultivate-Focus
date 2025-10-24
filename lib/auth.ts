import { compare } from "bcryptjs";
import type { NextAuthOptions, Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth";
import { Types } from "mongoose";

import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, type UserDocument } from "@/models/user";

const credentialsProvider = CredentialsProvider({
  name: "Credentials",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
  },
  async authorize(credentials) {
    const email = credentials?.email?.toLowerCase().trim();
    const password = credentials?.password;

    if (!email || !password) {
      return null;
    }

    await connectToDatabase();

    const user = (await UserModel.findOne({ email }).lean()) as
      | (UserDocument & { _id: Types.ObjectId })
      | null;

    if (!user || !user.passwordHash) {
      return null;
    }

    const isValid = await compare(password, user.passwordHash);

    if (!isValid) {
      return null;
    }

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name ?? user.email,
    };
  },
});

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET,
  providers: [credentialsProvider],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        const baseUser = session.user ?? {};
        session.user = {
          ...baseUser,
          id: token.id as string,
        } as Session["user"];
      }
      return session;
    },
  },
};

export function getAuthSession() {
  return getServerSession(authOptions);
}
