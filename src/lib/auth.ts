import authOptions from "@/lib/auth.config";
import NextAuth from "next-auth";

export const { handlers, signIn, auth, signOut } = NextAuth(authOptions);
