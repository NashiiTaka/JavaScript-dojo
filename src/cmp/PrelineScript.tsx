"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { IStaticMethods } from "preline/preline";
import { useRecoilState, stateQuestions } from "./states";

declare global {
  interface Window {
    HSStaticMethods: IStaticMethods;
  }
}

export default function PrelineScript() {
  const path = usePathname();
  const [questions, setQuestions] = useRecoilState(stateQuestions);

  useEffect(() => {
    const loadPreline = async () => {
      await import("preline/preline");

      window.HSStaticMethods.autoInit();
    };

    loadPreline();
  }, [path, questions]);

  return null;
}