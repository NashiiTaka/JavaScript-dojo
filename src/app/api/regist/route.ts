import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/Prisma";
import bcrypt from "bcrypt";
import { Session } from 'next-auth';
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { nickname } = await req.json();
  const session = await auth();
  let registerdNickname = '';

  try {
    if(!session){
      const err = '非ログイン状態で呼び出されました。';
      console.log(err);
      throw new Error(err);
    }

    const updatedUser = await prisma.user.update({
      where: { id: session?.user.id },
      data: { nickname: nickname },
    });
    registerdNickname = updatedUser.nickname as string;
  } catch(error) {
    console.error('ERROR api/regist: ', error);
    return new NextResponse(
      JSON.stringify({ errors: "データの更新に失敗" }),
      { status: 400 }
    );
  }
  return new NextResponse(JSON.stringify({ registerdNickname: registerdNickname }), {
    status: 201,
  });
}
