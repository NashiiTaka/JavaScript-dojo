'use client'

import React, { startTransition, useEffect } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { validationRegistUserInfo } from "@/validationSchema";
import { useSession } from "next-auth/react";
import { revalidateAndRedirectPath } from "@/lib/server_actions";

const Page = (props: any) => {
  const { data: session, status, update } = useSession();
  const [resError, setResError] = useState<Error>();
  const [nickname, nicknameSet] = useState<string>('');
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: "onChange",
    resolver: zodResolver(validationRegistUserInfo),
  });

  // ユーザー情報の登録処理の実行
  const handRegister = async (data: any) => {
    // 更新を実行する
    const res = await fetch("/api/regist", {
      body: JSON.stringify(data),
      headers: {
        "Content-type": "application/json",
      },
      method: "POST",
    });
    if (res.ok) {
      const { registerdNickname } = await res.json();
      await update({ nickname: registerdNickname });
      startTransition(async () => {
        // サーバーサイドでキャッシュクリアとリダイレクトを実施。
        await revalidateAndRedirectPath('/');
      });
    } else {
      const resError = await res.json();
      setResError(resError.errors);
    }
  };

  useEffect(() => {
    nicknameSet(session?.user?.nickname || '')
  },[status, session]);

  return (
    <>
      <div className="flex flex-col w-full h-screen text-sm items-center justify-center">
        <div className="flex flex-col items-center justify-center p-10 border-2 rounded-2xl">
          <p className="text-2xl font-bold mb-5">ユーザー情報登録</p>
          <form
            onSubmit={handleSubmit(handRegister)}
            className="flex flex-col items-center"
          >
            <div className="text-xs font-bold text-red-400 mb-4">
              {resError as React.ReactNode}
            </div>
            <label htmlFor="nickname">
              <p>ニックネーム</p>
              <input
                type="text"
                id="nickname"
                {...register("nickname")}
                className=" border-2 w-[300px] h-[35px] px-2 mb-2"
                disabled={status === "loading"}
                value={nickname}
                onChange={(e) => { nicknameSet(e.target.value) }}
              />
              <div className="text-xs font-bold text-red-400 mb-2">
                {errors.nickname?.message as React.ReactNode}
              </div>
            </label>
            <button
              type='submit'
              className="bg-white text-black border-2 w-[300px] h-[35px] mb-2"
              disabled={status === "loading"}
            >
              登録
            </button>
          </form>
        </div>
      </div >
    </>
  );
};

export default Page;