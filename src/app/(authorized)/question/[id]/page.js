'use client';

/**
 * @typedef PropsQuestion
 * @property {MdlQuestion | null} question
 */

import { useEffect, useState } from "react";
import MonacoEditorCmp from "/src/cmp/MonacoEditorCmp";
import MdlQuestion from "@/src/mdl/MdlQuestion";

export default function Question({ params }) {
  const mdlNew = new MdlQuestion();
  const [mdl, setMdl] = useState(mdlNew);

  useEffect(() => {
    MdlQuestion.get(params.id).then((mdlGet) => {
      setMdl(mdlGet);
    });
  }, [params.id])


  return (
    <div className="w-full pt-10 px-4 sm:px-6 md:px-8 lg:ps-72">
      <p className="text-2xl font-bold md:text-3xl dark:text-white">{mdl._category} / {mdl._caption}</p>
      <div className="max-w-[85rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14 mx-auto">
        <div className="w-full">
          <MonacoEditorCmp
            mdlQuestion={mdl}
          />
        </div>
      </div>
    </div>
  )
}