import MonacoEditorCmp from "@/cmp/MonacoEditorCmp";
import prisma from "@/lib/Prisma";
import MdlAnswer from "@/mdl/MdlAnswer";
import MdlQuestion from "@/mdl/MdlQuestion";

export default async function Question({ params }: { params: { id: string } }) {
  const mdlQuestion = await MdlQuestion.get(params.id);
  const mdlUser = await prisma.user.findUnique({ where: { id: mdlQuestion?.updateUserId as string } });

  return (
    <div className="w-full py-4 px-4 sm:px-6 md:px-8 min-h-screen flex flex-col">
        <MonacoEditorCmp
          mdlQuestionData={ mdlQuestion?.serializeData }
          mdlUserData={mdlUser}
        />
    </div>
  )
}