// @see https://stackoverflow.com/questions/74244256/type-string-is-not-assignable-to-type-sessionstrategy-undefined
import { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/src/lib/Prisma";

const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        let user = null; // `try`ブロックの外で`user`を宣言
        try {
          // メールアドレス存在チェック
          user = await prisma.user.findUnique({
            where: {
              email: credentials?.email
            },
          });
        } catch (error) {
          return null; // エラーが発生した場合はnullを返す
        }
        return user;
      },
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  session: {
    strategy: "jwt",
  },
  // https://zenn.dev/ohtasoji/articles/439eea63f1828c
  // しかし、NextAuth.jsのmiddlewareではJWTを使い認証をしています。そのためPrismaAdapterを使用するとデフォルトがデータベースセッションになってしまうため、middlewareが機能せず一生SignInページにリダイレクトされます。
  // session: {
  //   strategy: "database",
  //   maxAge: 60 * 60 * 24 * 30, // 30 days
  //   updateAge: 60 * 60 * 24, // 24 hours
  // },
  callbacks: {
    // async signIn({ user, account, profile, email, credentials }) {
    //   return true
    // },
    async redirect({ url, baseUrl }) {
      return baseUrl
    },
    async session({ session, token, user }) {
      if(session.user.id === undefined){
        session.user.id = token.sub || '';

      }
      return session
    },
    async jwt({ token, user, account, profile, isNewUser }) {
      return token
    }
  },
}

export default authOptions;