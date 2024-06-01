'use client'

// src/MonacoEditorCmp.js
import React, { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { Editor } from "@monaco-editor/react";
import MdlQuestion from "@/mdl/MdlQuestion";
import MdlAnswer from "@/mdl/MdlAnswer";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { dateToFormatedString } from "@/lib/util";
import { useDebouncedCallback } from "use-debounce";
import { revalidateAndRedirectPath } from "@/lib/server_actions";
import { useRecoilState } from "recoil";
import { stateQuestions } from "./states";
import { ChevronsLeft } from 'lucide-react';
import Link from "next/link";
import { useRouter } from "next/navigation";
import MyMarkdonw, { mkdAppliedClassName } from "./MyMarkdonw";

/**
 * モナコエディタ引数
 * @property {MdlQueston} mdlQuestion
 * @property {string} height css表記で指定、デフォルト500px
 * @property {string} width css表記で指定、デフォルト100%
 * @property {string} theme デフォルト vs
 * @property {string} defaultLanguage デフォルト javascript
 */
type PropsMonacoEditorCmp = {
  mdlQuestionData: any;
  mdlAuthorUserData: any;
  mdlSerializeAnswers: any;
  mdlAnswerUsers: any;
  mdlPreAnserData: any;
  height?: string;
  width?: string;
  defaultLanguage?: string;
}

const MonacoEditorCmp = (props: PropsMonacoEditorCmp) => {
  const { data: session, status } = useSession();
  const [sessionEnabled, sessionEnabledSet] = useState(false);
  const [output, setOutput] = useState("");
  const [outputCount, setOutputCount] = useState(0);
  const [registDisabled, setRegistDisabled] = useState(true);
  const [tests, setTests] = useState<any[]>([]);
  const [defaltValue, setDefaltValue] = useState("");
  const [mdlQuestion, mdlQuestionSet] = useState(new MdlQuestion(props.mdlQuestionData));
  const [mdlAuthorUserData, mdlAuthorUserDataSet] = useState(props.mdlAuthorUserData);
  const [mdlAnswers, mdlAnswersSet] = useState<MdlAnswer[]>([]);
  const [mdlAnswerUsers, mdlAnswerUsersSet] = useState<any[]>([]);
  const [mdlCurrentAnswer, mdlCurrentAnswerSet] = useState<MdlAnswer | null>(null);
  const [vsTheme, vsThemeSet] = useState<string | undefined>(undefined);
  const [os, osSet] = useState<string | undefined>(undefined);
  const [mdlMyLatestAnswer, SetMdlMyLatestAnswer] = useState<MdlAnswer | undefined>(undefined);

  const editorRef = useRef<any>(null);
  const editorRORef = useRef<any>(null);
  const tabEditor = useRef<HTMLButtonElement>(null!);
  const buttonRegistRef = useRef<HTMLButtonElement>(null!);

  const [questions, setQuestions] = useRecoilState(stateQuestions);

  const [preAfMdls, setPreAfMdls] = useState<{ next: MdlQuestion | null, previous: MdlQuestion | null }>({ next: null, previous: null });
  const router = useRouter();

  useEffect(() => {
    const getPrevAndNext = (): { next: MdlQuestion | null, previous: MdlQuestion | null } => {
      for (const key in questions) {
        for (let i = 0; i < questions[key].length; i++) {
          if (questions[key][i].id === mdlQuestion.id) {
            return {
              next: i + 1 < questions[key].length ? questions[key][i + 1] : null,
              previous: i !== 0 ? questions[key][i - 1] : null,
            }
          }
        }
      }
      return { next: null, previous: null };
    }
    setPreAfMdls(getPrevAndNext());
  }, [questions, mdlQuestion.id])

  // キータッチは連続してくるので、0.5秒ウェイトをかけてから実行する。
  const cb = useDebouncedCallback(async () => {
    localStorage.setItem(mdlQuestion.id + '_question', editorRef.current.getValue());
    runCode(tests, mdlMyLatestAnswer);
  }, 500);

  const handleEditorChange = () => {
    // 変更が走ったら、登録ボタンはすぐオフにしておく。
    if (!registDisabled) {
      setRegistDisabled(true);
    }
    cb();
  };

  function handleEditorWillMount(monaco: any) {
    monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);
  }

  function handleEditorDidMount(editor: any, monaco: any) {
    editorRef.current = editor;
    // キーバインディングの追加
    editor.addCommand(
      // ⌘Return or CtrlEnterで登録処理を実行
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      () => {
        buttonRegistRef.current.click();
      }
    );
  }
  function handleEditorDidMountRO(editor: any) {
    editorRORef.current = editor;
  }

  function makeCodeAndAnswers(mdl: MdlQuestion): [string, any[]] {
    if (!mdl._args_and_answer) {
      return ['', []];
    }
    const answers = JSON.parse(mdl._args_and_answer).answers;

    answers.forEach((answer: any) => {
      let funcCall = mdl._definition.replace("{}", "");
      funcCall = funcCall.replace("function ", "");
      for (const key in answer) {
        if (key !== "期待値") {
          const value =
            typeof answer[key] === "string" && answer[key] !== 'null' && answer[key] !== 'undefined' ? `"${answer[key]}"` : answer[key];
          // (直後の変数を置換
          funcCall = funcCall.replace(
            new RegExp(`(\\([\\s]*)${key}([,\\s\\)]+)`),
            `$1${value}$2`
          );
          // 第二引数以降の変数を置換
          funcCall = funcCall.replace(
            new RegExp(`(\\([^\\)]*[\\s,]+)${key}([,\\s\\)]+)`),
            `$1${value}$2`
          );
        }
      }
      const expected =
        typeof answer["期待値"] === "string" && answer["期待値"] !== 'null' && answer["期待値"] !== 'undefined'
          ? `"${answer["期待値"]}"`
          : answer["期待値"];

      answer.___log___ = `const ret = ${funcCall}; console.test_log(\`【\${${expected} === ret ? "○" : "×"}】 実行結果:【\${typeof ret === 'string' ? \`"\${ret}"\` : ret}】\`)`;
    });

    return [(
      '/**\n' +
      mdl._specification.replace(/^/gm, ' * ') + '\n' +
      ' */\n' +
      mdl._definition.replace(
        "{}",
        "{\n  // ここにコードを記述して下さい。\n}"
      )
    ), answers];
  };

  function getOS() {
    const userAgent = window.navigator.userAgent;

    if (userAgent.indexOf('Mac') !== -1) {
      return 'Mac';
    } else if (userAgent.indexOf('Win') !== -1) {
      return 'Windows';
    } else {
      return 'Other';
    }
  }

  /**
   * コードを実行する
   * @param argAnswers 解答の配列、初期化時はstateの反映がされない可能性があるため、引数で受ける
   * @param argCode 実行するコード、意図は同上
   * @returns void
   */
  const runCode = (argAnswers: any[], mdlCurrentAnswer: MdlAnswer | undefined, argCode: string | null = null) => {
    if (!editorRef.current && !argCode) { return; }

    const code = argCode || editorRef.current.getValue();
    const originalConsoleLog = console.log;
    let consoleLogs: string[] = [];
    let outputCountUpd = 0;
    try {
      // 結果を格納する配列を生成
      const results = [...argAnswers];

      let totalCount = 0;
      let okCount = 0;
      // Custom console.log implementation
      const customConsoleLog = (message = "") => {
        consoleLogs.push('No.' + (totalCount + 1).toString().padStart(2, "0") + ': ' + message);
        outputCountUpd++;
      };
      // Override console.log
      console.log = customConsoleLog;
      /* ★メソッドの追加★ */
      (console as any).test_log = (message = "") => {
        const bOk = message.match(/^【○】/);
        if (bOk) { okCount++; }
        const m = message.match(/実行結果:【(.*)】/);
        const result = m ? m[1] : '';

        results[totalCount]['結果'] = result;
        results[totalCount]['判定'] = bOk ? '○' : '×';
        totalCount++;
      }

      // Execute the JavaScript code
      results.forEach((test, i) => {
        try {
          const func = new Function(code + "\n" + test.___log___);
          func();
        } catch (error: any) {
          results[totalCount]['結果'] = error.message;
          results[totalCount]['判定'] = '×';
          totalCount++;
        }
      });

      setTests(results);
      // 自分の最新の答えが現在コードと一致する場合か、NGが一つでもある場合は登録ボタンをオフに
      setRegistDisabled(mdlCurrentAnswer?._answer === code || !(results.length <= okCount));
    } finally {
      setOutput(consoleLogs.join('\n'));
      setOutputCount(outputCountUpd);
      // Restore original console.log
      console.log = originalConsoleLog;
      delete (console as any).test_log;
    }
  };
  const runCodeWrapped = useCallback((argAnswers: any[], mdlCurrentAnswer: MdlAnswer | undefined, argCode: string | null = null) => {
    runCode(argAnswers, mdlCurrentAnswer, argCode)
  }, []);

  useEffect(() => {
    const newMdlQuestion = new MdlQuestion(props.mdlQuestionData);

    const preAnswer = props.mdlPreAnserData ? new MdlAnswer(props.mdlPreAnserData) : null;
    const [madeCode, answers] = makeCodeAndAnswers(newMdlQuestion);
    const lcl = localStorage.getItem(newMdlQuestion.id + '_question');
    const code = preAnswer ? preAnswer._answer : lcl || madeCode;
    setDefaltValue(code);
    if (editorRef.current) {
      editorRef.current.setValue(code);
    }
    setRegistDisabled(true);
    mdlQuestionSet(newMdlQuestion);
    mdlAuthorUserDataSet(props.mdlAuthorUserData);

    const allAnswers: MdlAnswer[] = props.mdlSerializeAnswers ? props.mdlSerializeAnswers.map((v: any) => new MdlAnswer(v)) : []
    mdlAnswersSet(allAnswers);

    const myLastAns = allAnswers.find((a) => a.updateUserId === session?.user.id);
    // 判定の初回実行を行う
    runCodeWrapped(answers, myLastAns, code);
    SetMdlMyLatestAnswer(myLastAns);

    mdlAnswerUsersSet(
      props.mdlAnswerUsers ?
        props.mdlAnswerUsers : []
    )

    if (vsTheme !== localStorage.getItem('vsTheme')) {
      vsThemeSet(localStorage.getItem('vsTheme') || 'vs');
    }

    osSet(getOS());

    if(document){
      const mdk = document.getElementsByClassName(mkdAppliedClassName);
      if(mdk?.length > 0){
        const links = mdk[0].getElementsByTagName('a');
        for(let i = 0; i < links.length; i++){
          if(links[i].getAttribute('target') !== '_blank'){
            links[i].setAttribute('target', '_blank');
          }
        }
      }
    }
  }, [props.mdlQuestionData, props.mdlAuthorUserData, props.mdlSerializeAnswers, props.mdlAnswerUsers, vsTheme, props.mdlPreAnserData, runCodeWrapped, session?.user.id])

  useEffect(() => {
    sessionEnabledSet(status !== "loading");
  }, [status, sessionEnabledSet])

  const handleRegist = async () => {
    setRegistDisabled(true);
    const mdl = new MdlAnswer();
    mdl.userIdUsedWhenSave = session?.user.id;
    mdl._answer = editorRef.current.getValue();
    mdl._question_id = mdlQuestion.id;
    await mdl.save();
    startTransition(async () => {
      if (preAfMdls.next?.id) {
        // 次の問題があるときは、クライアントのルーターでれリダイレクトを実施
        router.push('/question/' + preAfMdls.next?.id + (mdlQuestion._inheritToNext ? '/' + mdl.id : ''));
      } else {
        // 次の問題が無いときは、サーバーサイドでキャッシュクリアとリダイレクトを実施。
        await revalidateAndRedirectPath('/question/' + mdlQuestion.id);
      }
    });
  };

  const makeValue = (val: any, key: string) => {
    if (['結果', '判定'].includes(key)) { return val }

    if (typeof val === 'string') {
      return val === 'null' || val === 'undefined' ? val : '"' + val + '"';
    } else if (val === undefined) {
      return "undefined";
    } else if (val === null) {
      return "null";
    } else {
      return val;
    }
  }

  const argsAndAnswerParse = (answers: any[]) => {
    try {
      const keys: string[] = [];
      answers.forEach((answer: any) => {
        Object.keys(answer).forEach((key) => {
          if (!keys.includes(key) && key !== '___log___') {
            keys.push(key);
          }
        })
      });

      let answersNodes: JSX.Element[] = [];
      const tdClass = "text-center py-[4.4px]";
      const ngClass = " bg-red-300";
      const okClass = " bg-blue-300";
      answers.forEach((answer: any, i: number) => {
        answersNodes.push(
          <tr key={`answer${i}-tr`}>
            <td key={`answer${i}-no`} className={tdClass}>{i + 1}</td>
            {keys.map((key, j) => {
              return <td key={`answer${i}-${j}`} className={tdClass + (key === '判定' && (answer[key] === '○' ? okClass : ngClass))}>{makeValue(answer[key], key)}</td>
            })}
          </tr>
        )
      })

      const thClass = 'px-6 py-3 text-m font-medium text-gray-500 dark:text-neutral-400 text-center';

      return (
        <div className="flex flex-col flex-grow" id="segment-1" aria-labelledby="tag-1">
          <div className="-m-1.5 overflow-auto flex-grow">
            <div className="p-1.5 min-w-full inline-block align-middle pb-5 flex-grow">
              <div className="border rounded-lg shadow dark:border-neutral-700 dark:shadow-gray-900 flex-grow">
                <table className="w-full overflow-auto flex-grow">
                  <thead className="bg-gray-50 dark:bg-neutral-700">
                    <tr>
                      <th className={thClass}>No.</th>
                      {keys.map((key, index) => {
                        return (
                          <th key={`head${index}`} className={thClass}>{key}</th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
                    {answersNodes}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )
    } catch (error: any) {
      return <p>{error.toString()}</p>
    }
  }

  const handleAnswerClicked = (answer: MdlAnswer) => {
    mdlCurrentAnswerSet(answer);
    tabEditor.current.click();
  }

  const handleThemeChanged = (e: React.ChangeEvent<HTMLSelectElement>) => {
    vsThemeSet(e.target.value);
    localStorage.setItem('vsTheme', e.target.value);
  }

  const titleClassname = "font-bold";

  return (
    <>
      {/* ヘッダ */}
      <header className="font-bold md:text-xl dark:text-white flex">
        <p className="text-3xl underline decoration-dotted underline-offset-8">{mdlQuestion?._caption}</p>
        <div className="flex items-center ml-10">
          <div className="flex-shrink-0 relative">
            {mdlAuthorUserData?.image && (
              <div className="relative size-10 rounded-full">
                <Image
                  src={mdlAuthorUserData?.image}
                  alt="author"
                  fill
                  className="inline-block size-[46px] rounded-full"
                />
              </div>
            )}
          </div>
          <div className="ms-4">
            <div className="text-base font-semibold text-gray-800 dark:text-neutral-400">{mdlAuthorUserData?.nickname}</div>
            <div className="text-xs text-gray-500 dark:text-neutral-500">last modified: {dateToFormatedString(mdlQuestion.updatedAt)}</div>
          </div>
        </div>
      </header>
      {/* ヘッダ以降全て */}
      <main className="w-full flex-grow flex flex-col">
        {/* メイン上段 */}
        <div className="hs-accordion-group pt-3">
          <div className="hs-accordion active bg-white border -mt-px first:rounded-t-lg last:rounded-b-lg dark:bg-neutral-800 dark:border-neutral-700" id="hs-bordered-heading-one">
            <button className="hs-accordion-toggle hs-accordion-active:text-blue-600 inline-flex items-center gap-x-3 w-full font-semibold text-start text-gray-800 py-2 px-3 hover:text-gray-500 disabled:opacity-50 disabled:pointer-events-none dark:hs-accordion-active:text-blue-500 dark:text-neutral-200 dark:hover:text-neutral-400 dark:focus:outline-none dark:focus:text-neutral-400" aria-controls="hs-basic-bordered-collapse-one">
              <svg className="hs-accordion-active:hidden block size-3.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg>
              <svg className="hs-accordion-active:block hidden size-3.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14"></path>
              </svg>
              問題 & ヒント & 他の人の解答
            </button>
            <div id="hs-basic-bordered-collapse-one" className="hs-accordion-content w-full overflow-hidden transition-[height] duration-300" aria-labelledby="hs-bordered-heading-one">
              <div className="flex flex-row w-full h-80 pl-3 pb-3">
                {/* リード */}
                <div className="w-1/2 pr-3 h-full">
                  <div className="border py-3 rounded-lg shadow dark:border-neutral-700 dark:shadow-gray-900 ps-4 sm:ps-6 mb-5 h-full">
                    <blockquote className="relative ps-3 border-s-4 dark:border-neutral-700 h-full overflow-auto">
                      <MyMarkdonw>
                        {mdlQuestion._lead}
                      </MyMarkdonw>
                    </blockquote>
                  </div>
                </div>
                {/* ヒント〜他の人の解答 */}
                <div className="w-1/2 px-3 h-full">
                  <div className="flex flex-row h-full">
                    {/* ヒント アコーディオン */}
                    <div className="hs-accordion-group w-1/3 h-full overflow-auto">
                      {[1, 2, 3].map((n, i) => {
                        return mdlQuestion.data[`hint${n}`] && (
                          <div className="hs-accordion" id={`hs-basic-heading-${n}-hint`} key={`hs-basic-heading-${n}-hint`}>
                            <button
                              className="hs-accordion-toggle hs-accordion-active:text-blue-600 py-3 inline-flex items-center gap-x-3 w-full font-semibold text-start text-gray-800 hover:text-gray-500 rounded-lg disabled:opacity-50 disabled:pointer-events-none dark:hs-accordion-active:text-blue-500 dark:text-neutral-200 dark:hover:text-neutral-400 dark:focus:outline-none dark:focus:text-neutral-400"
                              aria-controls={`hs-basic-collapse-hint-${n}`}
                            >
                              <svg className="hs-accordion-active:hidden block size-3.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14"></path>
                                <path d="M12 5v14"></path>
                              </svg>
                              <svg className="hs-accordion-active:block hidden size-3.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14"></path>
                              </svg>
                              ヒント {n}
                            </button>
                            <div id={`hs-basic-collapse-hint-${n}`} className="hs-accordion-content w-full hidden overflow-hidden transition-[height] duration-300" aria-labelledby={`hs-basic-heading-${n}-hint`}>
                              <p className="text-gray-800 dark:text-neutral-200">
                                {mdlQuestion.data[`hint${n}`]}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {/* 解答リスト */}
                    <div className="bg-gray-100 w-2/3 h-full">
                      <div className="flex h-full w-full">
                        <div className="p-2 bg-white shadow-lg rounded-lg h-full w-full">
                          <div className="space-y-2 h-full overflow-auto w-full h-full">
                            {mdlAnswers.length ? mdlAnswers.map((answer) => {
                              const user = mdlAnswerUsers.find((u) => u.id === answer.updateUserId);
                              return (
                                <div key={answer.id} className={`flex items-center p-1 ${answer.id === mdlCurrentAnswer?.id ? 'bg-blue-100' : 'bg-gray-50'} hover:bg-blue-100 rounded-lg shadow w-full cursor-pointer`}
                                  onClick={() => handleAnswerClicked(answer)}
                                >
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
                            }) : <p>まだ解答はありません。</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* ヒント〜他の人の解答 */}
              </div>
            </div>
          </div>
        </div>
        {/* メイン下段 */}
        <div className="flex-grow flex flex-row pt-3">
          <div
            className="w-1/2 pr-3 flex-grow flex flex-col"
          >
            <div className="border rounded-lg shadow overflow-hidden dark:border-neutral-700 dark:shadow-gray-900 w-full relative flex-grow">
              <Editor
                className="absolute h-full overflow-y-scroll"
                height={props.height || "100%"}
                width={props.width || "100%"}
                defaultLanguage={props.defaultLanguage || "javascript"}
                defaultValue={defaltValue}
                onChange={handleEditorChange}
                theme={vsTheme} // Optional: 'vs' (default), 'vs-dark', 'hc-black', 'hc-light',  https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor.IGlobalEditorOptions.html#theme
                beforeMount={handleEditorWillMount}
                onMount={handleEditorDidMount}
                options={{
                  fontSize: 16,
                  tabSize: 2, // Ensure the tab size is set initially
                  insertSpaces: true, // Use spaces instead of tabs
                  minimap: { enabled: false }
                }}
              />
            </div>
            <div className="w-full flex justify-center items-center">
              <div className="w-1/4"></div>
              <div className="w-1/2 flex justify-center items-center">
                <Link
                  className={`${!preAfMdls.previous ? 'invisible ' : ''}w-1/3 pr-3 inline-flex items-center gap-x-1 text-gray-800 hover:text-blue-600 dark:text-neutral-200 dark:hover:text-blue-500`}
                  href={`/question/${preAfMdls.previous?.id}`}
                >
                  <svg className="flex-shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                  Prev
                </Link>
                <button
                  id="answers_check"
                  type="button"
                  className="w-1/3 my-4 py-3 px-4 text-center gap-x-2 text-sm rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
                  disabled={registDisabled || !sessionEnabled}
                  ref={buttonRegistRef}
                  onClick={handleRegist}
                >
                  登録{preAfMdls.next && ' & Next'}!{os && (os === 'Mac' ? <><br />⌘+↵</> : <><br />Ctrl+Enter</>)}
                  <br />
                </button>
                <Link
                  className={`${!preAfMdls.next ? 'invisible ' : ''}w-1/3 pl-3 inline-flex items-center gap-x-1 text-gray-800 hover:text-blue-600 dark:text-neutral-200 dark:hover:text-blue-500`}
                  href={`/question/${preAfMdls.next?.id}`}
                >
                  Next
                  <svg className="flex-shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                </Link>
              </div>
              <div className="w-1/4 flex flex-col justify-end items-center">
                <p className="pr-2 py-0 leading-6 h-6">theme</p>
                <select
                  className="py-2 px-2 border border-gray-400 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
                  onChange={e => handleThemeChanged(e)}
                  value={vsTheme}
                >
                  {!vsTheme && <option>loading</option>}
                  <option>vs</option>
                  <option>vs-dark</option>
                  <option>hc-black</option>
                  <option>hc-light</option>
                </select>
              </div>
            </div>
          </div>
          <div className="w-1/2 flex-grow pl-3 flex flex-col">
            <div className="flex-grow flex flex-row">
              {argsAndAnswerParse(tests)}
              <div id="segment-2" aria-labelledby="tag-2" className="flex-grow border rounded-lg shadow dark:border-neutral-700 dark:shadow-gray-900 w-full hidden">
                <pre className="h-full oveflow-auto">
                  {output}
                </pre>
              </div>
              <div className="border rounded-lg shadow overflow-hidden dark:border-neutral-700 dark:shadow-gray-900 w-full relative flex-grow hidden" id="segment-3" aria-labelledby="tag-3">
                {mdlCurrentAnswer ? (
                  <Editor
                    className="absolute h-full overflow-y-scroll"
                    height={props.height || "100%"}
                    width={props.width || "100%"}
                    defaultLanguage={props.defaultLanguage || "javascript"}
                    theme={vsTheme} // Optional: 'vs' (default), 'vs-dark', 'hc-black', 'hc-light',  https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor.IGlobalEditorOptions.html#theme
                    onMount={handleEditorDidMountRO}
                    value={mdlCurrentAnswer?._answer || ''}
                    options={{
                      fontSize: 16,
                      tabSize: 2, // Ensure the tab size is set initially
                      insertSpaces: true, // Use spaces instead of tabs
                      minimap: { enabled: false },
                      readOnly: true
                    }}
                  />
                )
                  : (
                    <div className="h-full w-full flex justify-center items-center">
                      <div className="text-5xl bg-red-50 p-3 rounded-lg">解答 未選択</div>
                    </div>
                  )
                }
              </div>
            </div>
            <div className="p-3">
              <div className="flex justify-center">
                <div className="flex bg-gray-100 hover:bg-gray-200 rounded-lg transition p-1 dark:bg-neutral-700 dark:hover:bg-neutral-600">
                  <nav className="flex space-x-1" aria-label="Tabs" role="tablist">
                    <button
                      type="button" id="tag-1" data-hs-tab="#segment-1" aria-controls="segment-1" role="tab"
                      className="active hs-tab-active:bg-white hs-tab-active:text-gray-700 hs-tab-active:dark:bg-neutral-800 hs-tab-active:dark:text-neutral-400 dark:hs-tab-active:bg-gray-800 py-3 px-4 inline-flex items-center gap-x-2 bg-transparent text-sm text-gray-500 hover:text-gray-700 font-medium rounded-lg hover:hover:text-blue-600 disabled:opacity-50 disabled:pointer-events-none dark:text-neutral-400 dark:hover:text-white"
                    >
                      判定
                    </button>
                    <button
                      type="button" id="tag-2" data-hs-tab="#segment-2" aria-controls="segment-2" role="tab"
                      className="hs-tab-active:bg-white hs-tab-active:text-gray-700 hs-tab-active:dark:bg-neutral-800 hs-tab-active:dark:text-neutral-400 dark:hs-tab-active:bg-gray-800 py-3 px-4 inline-flex items-center gap-x-2 bg-transparent text-sm text-gray-500 hover:text-gray-700 font-medium rounded-lg hover:hover:text-blue-600 disabled:opacity-50 disabled:pointer-events-none dark:text-neutral-400 dark:hover:text-white"
                    >
                      ログ:{outputCount}
                    </button>
                    <button
                      type="button" id="tag-3" data-hs-tab="#segment-3" aria-controls="segment-3" role="tab"
                      ref={tabEditor}
                      className="hs-tab-active:bg-white hs-tab-active:text-gray-700 hs-tab-active:dark:bg-neutral-800 hs-tab-active:dark:text-neutral-400 dark:hs-tab-active:bg-gray-800 py-3 px-4 inline-flex items-center gap-x-2 bg-transparent text-sm text-gray-500 hover:text-gray-700 font-medium rounded-lg hover:hover:text-blue-600 disabled:opacity-50 disabled:pointer-events-none dark:text-neutral-400 dark:hover:text-white"
                    >
                      コード
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div >
      </main >
    </>
  );
};

export default MonacoEditorCmp;
