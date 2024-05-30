import MonacoEditorCmp from "@/cmp/MonacoEditorCmp";
import prisma from "@/lib/Prisma";
import MdlAnswer from "@/mdl/MdlAnswer";
import MdlQuestion from "@/mdl/MdlQuestion";
import { PrismaAccelerate } from "prisma-accelerate-local";

export default async function Question({ params }: { params: { id: string } }) {
  const questionId = params.id;
  const mdlQuestion = await MdlQuestion.get(questionId);
  const mdlAuthorUserData = await prisma.user.findUnique({ where: { id: mdlQuestion?.updateUserId as string } });
  const mdlAnswers = (await MdlAnswer.getAll('question_id', '==', mdlQuestion?.id)).sort((a, b) => b.updatedAt - a.updatedAt);
  const mdlSerializeAnswers = mdlAnswers.length ? mdlAnswers.map((m) => m.serializeData) : null;
  const mdlAnswerUsers = mdlAnswers.length ? await prisma.user.findMany({
    where: {
      id: {
        in: mdlAnswers.map((m) => m.updateUserId ) as unknown as string[],
      },
    },
  }) : null;

  return (
    <div className="w-full py-4 px-4 sm:px-6 md:px-8 min-h-screen flex flex-col">
        <MonacoEditorCmp
          mdlQuestionData={ mdlQuestion?.serializeData }
          mdlAuthorUserData={mdlAuthorUserData}
          mdlSerializeAnswers={mdlSerializeAnswers}
          mdlAnswerUsers={mdlAnswerUsers}
        />
    </div>
  )
}