'use client'

// src/MonacoEditorCmp.js
import React, { useEffect, useRef, useState } from "react";
import { Editor } from "@monaco-editor/react";
import MdlQuestion from "@/src/mdl/MdlQuestion";
import MdlAnswer from "@/src/mdl/MdlAnswer";
import { useSession } from "next-auth/react";

/**
 * @typedef PropsMonacoEditorCmp
 * @property {MdlQueston} mdlQuestion
 * @property {String} height css表記で指定、デフォルト500px
 * @property {String} width css表記で指定、デフォルト100%
 * @property {String} theme デフォルト vs-dark
 * @property {String} defaultLanguage デフォルト javascript
 */

/**
 *
 * @param {PropsMonacoEditorCmp} props
 * @returns
 * @see https://www.npmjs.com/package/@monaco-editor/react
 */
const MonacoEditorCmp = (props) => {
  const { data: session, status } = useSession();

  const [output, setOutput] = useState("");
  const [registDisabled, setRegistDisabled] = useState(true);
  const [tests, setTests] = useState([]);
  const [defaltValue, setDefaltValue] = useState("");
  const editorRef = useRef(null);
  const mdlRef = useRef(null);

  const handleEditorChange = (value, event) => {
    // console.log('Editor value:', value);
    if(!registDisabled){
      setRegistDisabled(true);
    }
  };

  function handleEditorWillMount(monaco) {
    // here is the monaco instance
    // do something before editor is mounted
    monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);
  }

  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;
  }

  /**
   *
   * @param {MdlQuestion} mdl
   */
  const makeCode = (mdl) => {
    if (!mdl._args_and_answer) {
      return "";
    }
    const json = JSON.parse(mdl._args_and_answer);

    const editedTests = [];
    json.answers.forEach((answer) => {
      let funcCall = mdl._definition.replace("{}", "");
      funcCall = funcCall.replace("function ", "");
      for (const key in answer) {
        if (key !== "return") {
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
        typeof answer["return"] === "string"
          ? `"${answer["return"]}"`
          : answer["return"];

      editedTests.push({
        test: `${expected} === ${funcCall}`,
        log: `console.log(\`【\${${expected} === ${funcCall} ? "○" : "×"}】 ${funcCall}  期待値: ${expected}  実行結果: \${typeof ${funcCall} === 'string' ? \`"\${${funcCall}}"\` : ${funcCall}}\`)`,
      });
    });

    setTests(editedTests);

    return (
      mdl._specification +
      "\n" +
      mdl._definition.replace(
        "{}",
        "{\n  // ここにコードを記述して下さい。\n}"
      ) +
      "\n\n"
      // testLines.join('\n')
    );
  };

  const runCode = () => {
    if (editorRef.current) {
      const code = editorRef.current.getValue();
      const originalConsoleLog = console.log;
      try {
        // Clear previous output
        setOutput("");

        let okCount = 0;

        // Custom console.log implementation
        const customConsoleLog = (message = "") => {
          if (message.match(/^【○】/)) {
            okCount++;
          }
          setOutput((prevOutput) => prevOutput + message + "\n");
        };

        // Override console.log
        console.log = customConsoleLog;

        // Execute the JavaScript code
        tests.forEach((test) => {
          new Function(code + "\n" + test.log)();
        });
        console.log(`正解数: ${okCount}`);

        setRegistDisabled(!(tests.length <= okCount));
        // Restore original console.log
        console.log = originalConsoleLog;
      } catch (error) {
        console.log = originalConsoleLog;
        setOutput(error.toString());
      }
    }
  };

  if (mdlRef.current?.id !== props.mdlQuestion?.id) {
    mdlRef.current = props.mdlQuestion;
    const code = makeCode(mdlRef.current);
    setDefaltValue(code);
    if (editorRef.current) {
      editorRef.current.setValue(code);
    }
    setOutput("");
    setRegistDisabled(true);
  }

  const handleRegist = () => {
    setRegistDisabled(true);
    const mdl = new MdlAnswer();
    mdl._answer = editorRef.current.getValue();
    mdl._question_id = mdlRef.current.id;
    mdl._user_name = session.user?.name;
    mdl.save();
  };

  return (
    <>
      <div
        style={{
          height: props.height || "500px",
          width: props.width || "100%",
        }}
      >
        <Editor
          height={props.height || "500px"}
          widhth={props.width || "100%"}
          defaultLanguage="javascript"
          defaultValue={defaltValue}
          onChange={handleEditorChange}
          theme={props.theme || "vs-dark"} // Optional: You can set the theme here
          beforeMount={handleEditorWillMount}
          onMount={handleEditorDidMount}
          options={{
            fontSize: 18,
            tabSize: 2, // Ensure the tab size is set initially
            insertSpaces: true, // Use spaces instead of tabs
          }}
        />
      </div>
      <div>
        <pre>
          <label for="log" className="mt-5 block text-sm mb-2 dark:text-white">
            実行結果
          </label>
          <code id="log" className="block bg-slate-100">
            {output ?? <p>ログ出力</p>}
          </code>
        </pre>
      </div>
      <button
        className="my-4 py-3 px-4 inline-flex items-center gap-x-2 text-sm rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
        onClick={runCode}
      >
        Run Code
      </button>
      <button
        id="answers_check"
        type="button"
        className="ml-5 my-4 py-3 px-4 inline-flex items-center gap-x-2 text-sm rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
        disabled={registDisabled}
        onClick={handleRegist}
      >
        解答を登録！
      </button>
    </>
  );
};

export default MonacoEditorCmp;
