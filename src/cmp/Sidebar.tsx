"use client";

import MdlQuestion from "@/mdl/MdlQuestion";
import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

import Link from "next/link";
import { stateQuestions } from "./states";
import { useRecoilState } from "recoil";
import { usePathname } from "next/navigation"

import { ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function Sidebar(props: any) {
  const [questions, setQuestions] = useRecoilState(stateQuestions);
  const [minimized, minimizedSet] = useState(false);
  const pathname = usePathname();

  // 初回のonChildは一気に来るので、読込をまとめて行う。
  const cb = useDebouncedCallback(async () => {
    console.log("Sidebar::useDebouncedCallback: setQuestions(await MdlQuestion.getAll());");

    const datas = (await MdlQuestion.getAll()).sort(
      (a: MdlQuestion, b: MdlQuestion) => {
        return a._caption < b._caption ? -1 : a._caption > b._caption ? 1 : 0;
      }
    );

    const byCategory: Record<string, MdlQuestion[]> = {};
    datas.forEach((data) => {
      byCategory[data._category] ||= [];
      byCategory[data._category].push(data);
    });

    Object.keys(questions).forEach((key) => questions[key].forEach((q) => q.updateSync = false));

    setQuestions(byCategory);
  }, 500);

  useEffect(() => {
    const unsubscribe = MdlQuestion.onChildSnapshot(cb);
    return () => { unsubscribe() }
  }, [cb]);

  const clsCurrentPageTopTop = ' text-white bg-gray-600';
  const clsCurrentPageTopSub = ' text-white bg-gray-600';


  const toplevelButton = (title: string, controlAreaId: string, isAdmin = false) => {

    const icon = isAdmin ? (
      <>
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </>
    );

    return (
      <button
        type="button"
        className="hs-accordion-toggle w-full text-start flex items-center gap-x-3.5 py-2 px-2.5 hs-accordion-active:text-white hs-accordion-active:hover:bg-transparent text-sm text-gray-400 rounded-lg hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-1 focus:ring-gray-600"
        aria-controls={controlAreaId}
      >
        <svg
          className="flex-shrink-0 size-4"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {icon}
        </svg>
        {title}
        <svg
          className="hs-accordion-active:block ms-auto hidden size-4"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m18 15-6-6-6 6" />
        </svg>
        <svg
          className="hs-accordion-active:hidden ms-auto block size-4"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
    )
  }

  return (
    <div id="sidebar">

      <div
        className="sticky top-0 inset-x-0 z-20 bg-white border-y px-4 sm:px-6 md:px-8 lg:hidden dark:bg-neutral-800 dark:border-neutral-700"
        id="sidebar-top"
      >
        <div className="flex items-center py-4">
          {/* <!-- Navigation Toggle --> */}
          <button
            type="button"
            className="text-gray-500 hover:text-gray-600"
            data-hs-overlay="#application-sidebar-dark"
            aria-controls="application-sidebar-dark"
            aria-label="Toggle navigation"
          >
            <span className="sr-only">Toggle Navigation</span>
            <svg
              className="size-5"
              width="16"
              height="16"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path
                fillRule="evenodd"
                d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"
              />
            </svg>
          </button>
          {/* <!-- End Navigation Toggle --> */}

          {/* <!-- Breadcrumb --> */}
          <ol className="ms-3 flex items-center whitespace-nowrap">
            <li className="flex items-center text-sm text-gray-800 dark:text-neutral-400">
              Application Layout
              <svg
                className="flex-shrink-0 mx-3 overflow-visible size-2.5 text-gray-400 dark:text-neutral-600"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 1L10.6869 7.16086C10.8637 7.35239 10.8637 7.64761 10.6869 7.83914L5 14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </li>
            <li
              className="text-sm font-semibold text-gray-800 truncate dark:text-neutral-400"
            >
              Dashboard
            </li>
          </ol>
          {/* <!-- End Breadcrumb --> */}
        </div>
      </div>
      {/* <!-- End Sidebar Toggle --> */}

      {/* <!-- Sidebar --> */}
      <div
        className={minimized ? " " : "hidden"}
      >
        <ChevronsRight
          onClick={() => { minimizedSet(!minimized) }}
        />
      </div>
      <div
        id="application-sidebar-dark"
        className={
          !minimized ?
            // "hs-overlay [--auto-close:lg] hs-overlay-open:translate-x-0 -translate-x-full transition-all duration-300 transform hidden fixed top-0 start-0 bottom-0 z-[60] w-64 bg-gray-900 border-e border-gray-800 pt-7 pb-10 overflow-y-auto lg:block lg:translate-x-0 lg:end-auto lg:bottom-0 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-track]:bg-neutral-700 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500"
            "hs-overlay h-screen [--auto-close:lg] hs-overlay-open:translate-x-0 -translate-x-full transition-all duration-300 transform hidden z-[60] w-64 bg-gray-900 border-e border-gray-800 pt-7 pb-10 overflow-y-auto lg:block lg:translate-x-0 lg:end-auto lg:bottom-0 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-track]:bg-neutral-700 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500"
            : "hidden"
        }
      >
        <div className="px-6 flex justify-between">
          <a
            className="flex-none text-xl font-semibold text-white focus:outline-none focus:ring-1 focus:ring-gray-600"
            href="/"
            aria-label="Brand"
          >
            JavaScript道場
          </a>
          <div className="text-white">
            <ChevronsLeft
              onClick={() => { minimizedSet(!minimized) }}
            />
          </div>
        </div>

        <nav
          className="hs-accordion-group p-6 w-full flex flex-col flex-wrap"
        >
          <ul className="space-y-1.5">
            <li>
              <Link
                href="/"
                className={"flex items-center gap-x-3 py-2 px-2.5 text-sm text-gray-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-600" + (pathname === "/" && clsCurrentPageTopTop)}
              >
                <svg
                  className="flex-shrink-0 size-4"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                Dashboard
              </Link>
            </li>

            <li className="hs-accordion" id="acdn-admin-top">
              {toplevelButton('Admin', 'acdn-admin-children', true)}
              <div
                id="acdn-admin-children"
                className="hs-accordion-content w-full overflow-hidden transition-[height] duration-300 hidden"
              >
                <ul className="pt-2 ps-2">
                  <li>
                    <Link
                      href={`/admin/question/add`}
                      className={"flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-gray-400 rounded-lg hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-1 focus:ring-gray-600" + (pathname === "/admin/question/add" && clsCurrentPageTopTop)}
                    >
                      問題追加
                    </Link>
                  </li>
                  <li>
                    <div className="hs-accordion-group">
                      <ul className="pt-2 ps-2">
                        {Object.keys(questions).sort().map((key) => {
                          let firstQuestionId = questions[key][0].id;
                          const questionsNodes = questions[key].map((question) => {
                            return (
                              <li key={question.id + "_admin"} id={question.id + "_admin"}>
                                <Link
                                  href={`/admin/question/edit/${question.id}`}
                                  className={"flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-gray-400 rounded-lg hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-1 focus:ring-gray-600" + (pathname === `/admin/question/edit/${question.id}` && clsCurrentPageTopSub)}
                                >
                                  {question._caption}
                                </Link>
                              </li>
                            )
                          })

                          const parentId = firstQuestionId + "_wrapper_admin";
                          return (
                            <li className="hs-accordion" key={parentId} id={parentId + '-accordion'}>
                              {toplevelButton(key, parentId + "-accordion-child")}
                              <div
                                id={parentId + "-accordion-child"}
                                className="hs-accordion-content w-full overflow-hidden transition-[height] duration-300 hidden"
                                aria-labelledby={parentId + '-accordion'}
                              >
                                <ul className="pt-2 ps-2">
                                  {questionsNodes}
                                </ul>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </li>

                </ul>
              </div>
            </li>

            {Object.keys(questions).sort().map((key) => {
              let firstQuestionId = questions[key][0].id;
              const questionsNodes = questions[key].map((question) => {
                return (
                  <li key={question.id} id={question.id}>
                    <Link
                      href={`/question/${question.id}`}
                      className={"flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-gray-400 rounded-lg hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-1 focus:ring-gray-600" + (pathname === `/question/${question.id}` && clsCurrentPageTopSub)}
                    >
                      {question._caption}
                    </Link>
                  </li>
                )
              })

              const parentId = firstQuestionId + "_wrapper";
              return (
                <li className="hs-accordion" key={parentId} id={parentId + '-accordion'}>
                  {toplevelButton(key, parentId + "-accordion-child")}
                  <div
                    id={parentId + "-accordion-child"}
                    className="hs-accordion-content w-full overflow-hidden transition-[height] duration-300 hidden"
                  >
                    <ul className="pt-2 ps-2">
                      {questionsNodes}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
