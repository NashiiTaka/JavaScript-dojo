"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

// import Skeleton from '@mui/material/Skeleton';
export default function Home() {
  const { data: session, status } = useSession();
  return (
    <>
      <div className="flex items-center justify-center flex-col w-screen h-screen">
        <h1 className="text-3xl m-10 font-bold">JavaScript道場</h1>
        <div className="flex items-center flex-col m-5">
          <div className="m-2">ログイン中のユーザー</div>
          {status === "loading" ? (
            //  <Skeleton variant="text" animation="wave" width={175} height={25}/>
            <p>loading</p>
          ) : (
            <div className="flex items-center">
              {session?.user?.image && (
                <div className="relative h-10 w-10 mr-3">
                  <Image
                    src={session?.user?.image}
                    alt="pict"
                    fill
                    className="inline-block size-[46px] rounded-full"
                  />
                </div>
              )}
              <p className="font-bold">{session?.user?.nickname}</p>
            </div>
          )}
        </div>
        <div className="flex text-between w-80">
          <Link
            href="/regist"
            className="w-1/2 ml-5 bg-blue-500 hover:bg-blue-600 py-2 px-3 text-white rounded-lg text-center"
          >
            登録情報<br />修正
          </Link>
          <button
            onClick={() => signOut()}
            className="w-1/2 ml-5 bg-blue-500 hover:bg-blue-600 py-2 px-3 text-white rounded-lg"
          >
            サインアウト
          </button>
        </div>
      </div>
    </>
  );
}
