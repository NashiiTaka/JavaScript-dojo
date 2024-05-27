// @see https://stackoverflow.com/questions/74244256/type-string-is-not-assignable-to-type-sessionstrategy-undefined
// import { NextAuthOptions } from "next-auth";
import type { NextAuthConfig } from "next-auth"

import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/Prisma";

// edge対応
// import { PrismaClient } from '@prisma/client/edge'
// import { withAccelerate } from '@prisma/extension-accelerate'
// const prismaEdge = new PrismaClient().$extends(withAccelerate());

const authOptions: NextAuthConfig = {
  // secret: process.env.NEXTAUTH_SECRET,
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
              email: credentials?.email as string
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
  useSecureCookies: process.env.NODE_ENV === "production",
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
    // async redirect({ url, baseUrl }) {
    //   return baseUrl
    // },
    async session({ session, token, user }) {
      session.user.id = token.sub || '';
      session.user.nickname = token.nickname || '';
      return session
    },
    /**
     * @see https://next-auth.js.org/getting-started/client#updating-the-session
     * jwtを使用している場合、セッション情報ではなくjwtのtokenを更新する必要がある。
     */
    async jwt({ token, user, account, profile, trigger }) {
      if(!token.sub){ return token }

      if (trigger === "update") {
        // Auth.js v5 からsessionが引数でなくなって見れなくなった。。。代替が見つからなかったので、User情報を読み込んで再書き込みする。
        console.log('if (trigger === "update") {');
        const dbUser = await prisma.user.findUnique({ where: { id: token.sub } })
        token.nickname = dbUser?.nickname || '';
      }

      else if (token.nickname === undefined) {
        console.log('else if (token.nickname === undefined) {');
        const dbUser = await prisma.user.findUnique({ where: { id: token.sub } })
        console.log('const dbUser = await prisma.user.findUnique({ where: { id: token.sub } }) : ' + dbUser?.nickname || '');
        token.nickname = dbUser?.nickname || '';
      }

      return token
    }
  },
}

export default authOptions;