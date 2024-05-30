"use client";
import { useEffect, useState, startTransition } from "react";
import MdlQuestion from "@/mdl/MdlQuestion";
import { useSession } from 'next-auth/react';
import { revalidateAndRedirectPath } from "@/lib/server_actions"

export default function EditQuestion({ params }: { params?: { id?: string } }) {
  const { data: session, status } = useSession();
  const initSpecification =
    `文字列の中から、指定された位置の文字を1文字取得してください。

【引数】 ※{型}、変数名、変数説明
@param {target} target 対象の文字列
@param {number} at 0始まり。0の場合は1文字目、1の場合は2文字目・・・

【戻り値】※{型}、説明
@returns {string} 指定位置の文字`;

  const initDefinition = `function exampleFunction(target, at){}`;

  const initArgsAndAnswer = `{
  "answers": [
    {"target": "1234567890", "at": 7, "期待値": 8},
    {"target": "1234567890", "at": 3, "期待値": 4}
  ]
}`;

  const [mdl, setMdl] = useState(new MdlQuestion());
  const [category, setCategory] = useState(mdl._category || '');
  const [lead, setLead] = useState(mdl._lead || '');
  const [caption, setCaption] = useState(mdl._caption || '');
  const [specification, setSpecification] = useState(mdl._specification || initSpecification);
  const [definition, setDefinition] = useState(mdl._definition || initDefinition);
  const [argsAndAnswer, setArgsAndAnswer] = useState(mdl._args_and_answer || initArgsAndAnswer);
  const [hint1, setHint1] = useState(mdl._hint1 || '');
  const [hint2, setHint2] = useState(mdl._hint2 || '');
  const [hint3, setHint3] = useState(mdl._hint3 || '');
  const [inheritToNext, setInheritToNext] = useState(mdl._inheritToNext || false);

  useEffect(() => {
    const setParams = (mdl: MdlQuestion) => {
      setCategory(mdl._category || '');
      setCaption(mdl._caption || '');
      setLead(mdl._lead || '');
      setSpecification(mdl._specification || initSpecification);
      setDefinition(mdl._definition || initDefinition);
      setArgsAndAnswer(mdl._args_and_answer || initArgsAndAnswer);
      setHint1(mdl._hint1 || '');
      setHint2(mdl._hint2 || '');
      setHint3(mdl._hint3 || '');
      setInheritToNext(mdl._inheritToNext || false)
      setMdl(mdl || '');
    }

    if (params?.id) {
      MdlQuestion.get(params.id).then((mdl) => {
        setParams(mdl as MdlQuestion);
      });
    } else {
      setParams(new MdlQuestion());
    }

  }, [params?.id, initSpecification, initDefinition, initArgsAndAnswer]);

  const onRegistClicked = async () => {
    mdl.userIdUsedWhenSave = session?.user.id;
    mdl._category = category;
    mdl._caption = caption;
    mdl._lead = lead;
    mdl._specification = specification;
    mdl._definition = definition;
    mdl._args_and_answer = argsAndAnswer;
    mdl._hint1 = hint1;
    mdl._hint2 = hint2;
    mdl._hint3 = hint3;
    mdl._inheritToNext = inheritToNext;
    await mdl.save();

    startTransition(async () => {
      // サーバーサイドでキャッシュクリアとリダイレクトを実施。
      await revalidateAndRedirectPath('/question/' + mdl.id);
    });
  };

  const onDeleteClicked = async () => {
    await mdl.delete();
    startTransition(async () => {
      // サーバーサイドでキャッシュクリアとリダイレクトを実施。
      await revalidateAndRedirectPath('/question/' + mdl.id, '/');
    });
  };

  const argsAndAnswerParse = () => {
    try {
      const json = JSON.parse(argsAndAnswer);
      const keys: string[] = [];
      json.answers.forEach((answer: any) => {
        Object.keys(answer).forEach((key) => {
          if (!keys.includes(key)) {
            keys.push(key);
          }
        })
      });

      const makeValue = (val: any) => {
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

      let answersNodes: JSX.Element[] = [];
      const tdClass = "text-center py-[4.4px]";
      json.answers.forEach((answer: any, i: number) => {
        answersNodes.push(
          <tr key={`answer${i}-tr`}>
            <td key={`answer${i}-no`} className={tdClass}>{i + 1}</td>
            {keys.map((key, j) => {
              return <td key={`answer${i}-${j}`} className={tdClass}>{makeValue(answer[key])}</td>
            })}
          </tr>
        )
      })

      const thClass = 'px-6 py-3 text-m font-medium text-gray-500 dark:text-neutral-400 text-center';

      return (
        <div className="flex flex-col">
          <div className="-m-1.5 overflow-x-auto">
            <div className="p-1.5 min-w-full inline-block align-middle">
              <div className="border rounded-lg shadow overflow-hidden dark:border-neutral-700 dark:shadow-gray-900">
                <table className="w-full">
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

  const captionClass = "whitespace-nowrap font-bold";
  const captionClassWithMt = captionClass + " pt-3";

  const setInheritToNextWrap = (e: any) => {
    setInheritToNext(e.target.checked);
  }

  return (
    <div className="w-full pt-6 px-4 sm:px-6 md:px-8">
      <div className="max-w-[85rem] mx-auto">
        <div className="flex w-full">
          <div className="flex w-1/3">
            <div className="flex items-center"><p className={`${captionClass}`}>カテゴリ</p></div>
            <input
              type="text"
              className="w-full ml-5 py-3 px-4 block w-full bg-gray-100 border-transparent rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:border-transparent dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <div className="flex ml-10 w-1/3">
            <div className="flex items-center"><p className={`${captionClass}`}>キャプション</p></div>
            <input
              type="text"
              className="w-full ml-5 py-3 px-4 block w-full bg-gray-100 border-transparent rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:border-transparent dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>
          <div className="flex ml-10 w-1/3">
            <div className="flex items-center pr-3"><label htmlFor="is-inherit" className={`${captionClass}`}>解答を次の問題に引き継ぐ</label></div>
            <input type="checkbox" id="is-inherit" name="is-inherit" checked={inheritToNext} onChange={(e) =>  { setInheritToNextWrap(e) }} />
          </div>
        </div>
        <div className="flex mt-5">
          <div className="flex flex-col w-1/3 h-80">
            <p className={captionClassWithMt}>リード</p>
            <textarea
              className="p-3 block w-full h-full bg-gray-100 border-transparent rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:border-transparent dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
              value={lead}
              onChange={(e) => setLead(e.target.value)}
            ></textarea>
          </div>
          <div className="flex flex-col w-1/3 ml-5 h-80">
            <p className={captionClassWithMt}>問題文</p>
            <textarea
              className="p-3 block w-full h-full bg-gray-100 border-transparent rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:border-transparent dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
              value={specification}
              onChange={(e) => setSpecification(e.target.value)}
            ></textarea>
          </div>
          <div className="w-1/3 ml-5">
            <div className="h-1/3">
              <p className={captionClassWithMt}>ヒント1</p>
              <textarea
                className="py-3 px-4 block w-full bg-gray-100 border-transparent rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:border-transparent dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
                value={hint1}
                onChange={(e) => setHint1(e.target.value)}
              />
            </div>
            <div className="h-1/3">
              <p className={captionClassWithMt}>ヒント2</p>
              <textarea
                className="py-3 px-4 block w-full bg-gray-100 border-transparent rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:border-transparent dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
                value={hint2}
                onChange={(e) => setHint2(e.target.value)}
              />
            </div>
            <div className="h-1/3">
              <p className={captionClassWithMt}>ヒント3</p>
              <textarea
                className="py-3 px-4 block w-full bg-gray-100 border-transparent rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:border-transparent dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
                value={hint3}
                onChange={(e) => setHint3(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-between w-full h-[26.5rem]">
          <div className="flex flex-col w-full h-full">
            <p className={captionClassWithMt}>関数定義</p>
            <input
              type="text"
              className="py-3 px-4 block w-full bg-gray-100 border-transparent rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:border-transparent dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
            />
            <p className={captionClassWithMt}>テスト値 & 期待値 JSON</p>
            <textarea
              className="p-3 bg-gray-100 w-full h-full block border-transparent rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:border-transparent dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
              value={argsAndAnswer}
              onChange={(e) => setArgsAndAnswer(e.target.value)}
            />
          </div>
          <div className="w-full ml-5">
            <p className={captionClassWithMt}>JSON 検証</p>
            {argsAndAnswerParse()}
          </div>
        </div>
        {status !== 'loading' && (
          <div className="flex justify-center w-full">
            <button
              className="my-4 py-3 px-4 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:pointer-events-none"
              onClick={onRegistClicked}
            >
              {params?.id ? '更新' : '登録'}
            </button>
            {params?.id ? (
              <>
                <button
                  className="my-4 ml-3 py-3 px-4 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:pointer-events-none"
                  onClick={onDeleteClicked}
                >
                  削除
                </button>
              </>
            ) : ''
            }
          </div>
        )}
      </div>
    </div >
  );
}
