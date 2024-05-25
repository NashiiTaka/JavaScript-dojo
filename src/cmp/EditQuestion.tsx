"use client";
import { useEffect, useState } from "react";
import MdlQuestion from "@/src/mdl/MdlQuestion";
import { useRouter } from 'next/navigation';

export default function EditQuestion({ params }: { params?: { id?: string } }) {
  const router = useRouter();
  const initSpecification =
`文字列の中から、指定された位置の文字を1文字取得してください。

【引数】 ※{型}、変数名、変数説明
@param {number} target 対象の文字列
@param {string} at 0始まり。0の場合は1文字目、1の場合は2文字目・・・

【戻り値】※{型}、説明
@returns {string} 指定位置の文字`;

  const initDefinition = `function exampleFunction(target, at){}`;

  const initArgsAndAnswer = `{
  "answers": [
    {"target": "1234567890", "at": 7, "return": 8},
    {"target": "1234567890", "at": 3, "return": 4}
  ]
}`;

  const [mdl, setMdl] = useState(new MdlQuestion());
  const [category, setCategory] = useState(mdl._category || '');
  const [caption, setCaption] = useState(mdl._caption || '');
  const [specification, setSpecification] = useState(mdl._specification || initSpecification);
  const [definition, setDefinition] = useState(mdl._definition || initDefinition);
  const [argsAndAnswer, setArgsAndAnswer] = useState(mdl._args_and_answer || initArgsAndAnswer);

  useEffect(() => {
    const setParams = (mdl: MdlQuestion) => {
      setCategory(mdl._category);
      setCaption(mdl._caption);
      setSpecification(mdl._specification || initSpecification);
      setDefinition(mdl._definition || initDefinition);
      setArgsAndAnswer(mdl._args_and_answer || initArgsAndAnswer);
      setMdl(mdl);
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
    mdl._category = category;
    mdl._caption = caption;
    mdl._specification = specification;
    mdl._definition = definition;
    mdl._args_and_answer = argsAndAnswer;
    await mdl.save();
    router.push('/');
  };

  const onDeleteClicked = async () => {
    await mdl.delete();
    router.push('/');
  };

  return (
    <div className="w-full pt-6 px-4 sm:px-6 md:px-8 lg:ps-72">
      <div className="max-w-[85rem] mx-auto">
        <p className="mt-3">カテゴリ</p>
        <input
          type="text"
          className="py-3 px-4 block w-full bg-gray-100 border-transparent rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:border-transparent dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <p className="mt-3">キャプション</p>
        <input
          type="text"
          className="py-3 px-4 block w-full bg-gray-100 border-transparent rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:border-transparent dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
        <p className="mt-3">問題文</p>
        <textarea
          className="py-3 px-4 block w-full h-64 bg-gray-100 border-transparent rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:border-transparent dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
          value={specification}
          onChange={(e) => setSpecification(e.target.value)}
        ></textarea>
        <p className="mt-3">関数定義</p>
        <input
          type="text"
          className="py-3 px-4 block w-full bg-gray-100 border-transparent rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:border-transparent dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
          value={definition}
          onChange={(e) => setDefinition(e.target.value)}
        />
        <p className="mt-3">テスト値 & 期待値</p>
        <textarea
          className="py-3 px-4 block w-full h-64 bg-gray-100 border-transparent rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:border-transparent dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
          value={argsAndAnswer}
          onChange={(e) => setArgsAndAnswer(e.target.value)}
        />
        <button
          className="my-4 py-3 px-4 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
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
    </div>
  );
}
