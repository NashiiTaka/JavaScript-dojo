'use server'

import prisma from "@/lib/Prisma";
import MdlAnswer from "@/mdl/MdlAnswer";
import { dateToFormatedString } from "@/lib/util";
import Image from "next/image";


export default async function RecentAnswers(props: { questionId: string }) {
  // const mdlAnswers = await MdlAnswer.getAll('question_id', '==', props.questionId);
  // const mdlAnswers = await MdlAnswer.getAll('question_id', '==', props.questionId);
  // const mdlUsers = mdlAnswers.length ? await prisma.user.findMany({
  //   where: {
  //     id: {
  //       in: mdlAnswers.map((m) => { m.updateUserId }) as unknown as string[],
  //     },
  //   },
  // }) : null;

  // const mdlAnswers: MdlAnswer[] = [];
  // const mdlUsers = null;
  return (
    <div className="bg-gray-100 w-2/3 h-full">
      <div className="flex h-full w-full">
        <div className="p-4 bg-white shadow-lg rounded-lg h-full w-full">
          <div className="space-y-4 h-full overflow-auto w-full">
            {/* {mdlUsers !== null ? mdlAnswers.map((answer) => {
              const user = mdlUsers.find((u) => u.id == answer.updateUserId);
              return (
                <div key={answer.id} className="flex items-center p-2 bg-gray-50 rounded-lg shadow w-full">
                  <div className="flex-shrink-0 relative ">
                    {user?.image && (
                      <div className="relative size-10 rounded-full">
                        <Image
                          src={user?.image}
                          alt="author"
                          fill
                          className="inline-block size-[46px] rounded-full"
                        />
                      </div>
                    )}
                  </div>
                  <div className="ms-4">
                    <div className="text-base font-semibold text-gray-800 dark:text-neutral-400">{user?.nickname}</div>
                    <div className="text-xs text-gray-500 dark:text-neutral-500">last modified: {dateToFormatedString(answer.updatedAt)}</div>
                  </div>
                </div>
              )
            }) : <p>まだ解答はありません。</p>} */}
          </div>
        </div>
      </div>
    </div>
  )
}