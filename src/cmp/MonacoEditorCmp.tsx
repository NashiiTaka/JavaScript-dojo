'use client'

// src/MonacoEditorCmp.js
import React, { startTransition, useEffect, useRef, useState } from "react";
import { Editor } from "@monaco-editor/react";
import MdlQuestion from "@/mdl/MdlQuestion";
import MdlAnswer from "@/mdl/MdlAnswer";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { dateToFormatedString } from "@/lib/util";
import { useDebouncedCallback } from "use-debounce";
import RecentAnswers from "@/cmp/RecentAnswers";
import { revalidateAndRedirectPath } from "@/lib/server_actions";

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
  mdlUserData: any;
  height?: string;
  width?: string;
  theme?: string;
  defaultLanguage?: string;
}

const MonacoEditorCmp = (props: PropsMonacoEditorCmp) => {
  const { data: session, status } = useSession();

  const [output, setOutput] = useState("");
  const [registDisabled, setRegistDisabled] = useState(true);
  const [sessionEnabled, sessionEnabledSet] = useState(false);
  const [tests, setTests] = useState<any[]>([]);
  const [defaltValue, setDefaltValue] = useState("");
  const [mdlQuestion, mdlQuestionSet] = useState(new MdlQuestion(props.mdlQuestionData));
  const [mdlUserData, mdlUserDataSet] = useState(props.mdlUserData);
  const editorRef = useRef<any>(null);
  const [questionId, questionIdSet] = useState(props.mdlQuestionData.id);

  // 初回のonChildは一気に来るので、読込をまとめて行う。
  const cb = useDebouncedCallback(async () => {
    localStorage.setItem(mdlQuestion.id + '_question', editorRef.current.getValue());
    runCode();
  }, 1000);

  const handleEditorChange = () => {
    cb();
    // console.log('Editor value:', value);
    if (!registDisabled) {
      setRegistDisabled(true);
    }
  };

  function handleEditorWillMount(monaco: any) {
    // here is the monaco instance
    // do something before editor is mounted
    monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);
  }

  function handleEditorDidMount(editor: any) {
    editorRef.current = editor;
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
            typeof answer[key] === "string" ? `"${answer[key]}"` : answer[key];
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
        typeof answer["期待値"] === "string"
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

  /**
   * 
   */
  const runCode = () => {
    if (editorRef.current) {
      const code = editorRef.current.getValue();
      const originalConsoleLog = console.log;
      let consoleLogs: string[] = [];
      try {
        // 結果を格納する配列を生成
        const results = [...tests];

        // Custom console.log implementation
        const customConsoleLog = (message = "") => {
          consoleLogs.push(message);
        };

        let totalCount = 0;
        let okCount = 0;
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

        // Object.setPrototypeOf(console, customTestLog);
        // オブジェクトの各種出力

        // Execute the JavaScript code
        results.forEach((test, i) => {
          try {
            originalConsoleLog("🚀 ~ runCode ~ :", i)
            const func = new Function(code + "\n" + test.___log___);
            originalConsoleLog("🚀 ~ runCode ~ : results.length1: ", consoleLogs.length)
            func();
            originalConsoleLog("🚀 ~ runCode ~ : results.length2: ", consoleLogs.length)
          } catch (error: any) {
            results[totalCount]['結果'] = error.message;
            results[totalCount]['判定'] = '×';
            totalCount++;
          }
        });

        setTests(results);
        setRegistDisabled(!(results.length <= okCount));
      } finally {
        setOutput(consoleLogs.join('\n'));
        // Restore original console.log
        console.log = originalConsoleLog;
        delete (console as any).test_log;
      }
    }
  };

  useEffect(() => {
    const newMdlQuestion = new MdlQuestion(props.mdlQuestionData);

    const [madeCode, answers] = makeCodeAndAnswers(newMdlQuestion);
    const lcl = localStorage.getItem(newMdlQuestion.id + '_question');
    const code = lcl || madeCode;
    setTests(answers);
    setDefaltValue(code);
    if (editorRef.current) {
      editorRef.current.setValue(code);
    }
    setOutput("");
    setRegistDisabled(true);
    mdlQuestionSet(newMdlQuestion);
    mdlUserDataSet(props.mdlUserData);
    questionIdSet(newMdlQuestion.id)
  }, [props.mdlQuestionData, props.mdlUserData])

  useEffect(() => {
    sessionEnabledSet(status !== "loading");
  }, [status])

  const handleRegist = async () => {
    setRegistDisabled(true);
    const mdl = new MdlAnswer();
    mdl.userIdUsedWhenSave = session?.user.id;
    mdl._answer = editorRef.current.getValue();
    mdl._question_id = mdlQuestion.id;
    await mdl.save();
    startTransition(async () => {
      // サーバーサイドでキャッシュクリアとリダイレクトを実施。
      await revalidateAndRedirectPath('/question/' + mdlQuestion.id);
    });
  };

  const makeValue = (val: any, key: string) => {
    if (['結果', '判定'].includes(key)) { return val }

    if (typeof val === 'string') {
      return '"' + val + '"';
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
        <div className="flex flex-col">
          <div className="-m-1.5 overflow-auto">
            <div className="p-1.5 min-w-full inline-block align-middle  pb-5">
              <div className="border rounded-lg shadow dark:border-neutral-700 dark:shadow-gray-900">
                <table className="w-full overflow-auto">
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

  const titleClassname = "font-bold";

  return (
    <>
      {/* ヘッダ */}
      <header className="font-bold md:text-xl dark:text-white flex">
        <p className="text-3xl underline decoration-dotted underline-offset-8">{mdlQuestion?._caption}</p>
        <div className="flex items-center ml-10">
          <div className="flex-shrink-0 relative ">
            {props.mdlUserData?.image && (
              <div className="relative size-10 rounded-full">
                <Image
                  src={props.mdlUserData?.image}
                  alt="author"
                  fill
                  className="inline-block size-[46px] rounded-full"
                />
              </div>
            )}
          </div>
          <div className="ms-4">
            <div className="text-base font-semibold text-gray-800 dark:text-neutral-400">{props.mdlUserData?.nickname}</div>
            <div className="text-xs text-gray-500 dark:text-neutral-500">last modified: {dateToFormatedString(mdlQuestion.updatedAt)}</div>
          </div>
        </div>
      </header>
      {/* ヘッダ以降全て */}
      <main className="w-full flex-grow flex flex-col">
        {/* メイン上段 */}
        <div className="flex flex-row w-full h-80 pt-6 pb-3">
          <div className="w-1/2 pr-3 h-full">
            <div className="border py-3 rounded-lg shadow dark:border-neutral-700 dark:shadow-gray-900 ps-4 sm:ps-6 mb-5 h-full">
              <blockquote className="relative border-s-4 dark:border-neutral-700 h-full overflow-auto">
                <pre className="text-gray-800 text-wrap dark:text-white ps-3">
                  {mdlQuestion._lead}
                </pre>
              </blockquote>
            </div>
          </div>
          <div className="w-1/2 px-3 h-full">
            <div className="flex flex-row">
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
                          {/* <pre className="text-gray-800 dark:text-neutral-200"> */}
                          {mdlQuestion.data[`hint${n}`]}
                          {/* </pre> */}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
              <RecentAnswers questionId={questionId}/>
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
                theme={props.theme || "vs"} // Optional: 'vs' (default), 'vs-dark', 'hc-black', 'hc-light',  https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor.IGlobalEditorOptions.html#theme
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
            <div>
              <button
                id="answers_check"
                type="button"
                className="ml-5 my-4 py-3 px-4 inline-flex items-center gap-x-2 text-sm rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
                disabled={registDisabled || !sessionEnabled}
                onClick={handleRegist}
              >
                解答を登録！
              </button>
            </div>
          </div>
          <div className="w-1/2 flex-grow pl-3">
            {argsAndAnswerParse(tests)}
          </div>
          <pre>
            {output}
          </pre>
        </div>
      </main>
    </>
  );
};

export default MonacoEditorCmp;
