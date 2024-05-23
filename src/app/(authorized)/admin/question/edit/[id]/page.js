"use client";
import { useEffect, useState } from "react";
import MdlQuestion from "@/src/mdl/MdlQuestion";
// import { useRouter } from 'next/router';
import { useRouter } from 'next/navigation';

export default function QuestionEdit({ params }) {
  const router = useRouter();
  const initSpecification = `// 入力例 【関数説明】【引数説明】【戻り値説明】を記載して下さい。
/**
 * 【関数説明】文字列の中から、指定された位置の文字を取得する。
 * @param {String} target 対象の文字列 【引数説明1】
 * @param {Number} at 取得する文字の位置。0から始まる。【引数説明2】
 * @returns {String} 指定位置の文字【戻り値説明】
 */`;

  const initDefinition = `function exampleFunction(target, search){}`;

  const initArgsAndAnswer = `// answersの配列の中に、引数と期待値を記載して下さい。
{
  "answers": [
    {"target": "1234567890", "search": "7", "return": 6},
    {"target": "1234567890", "search": "7890", "return": 6},
  ]
}`;

  const [mdl, setMdl] = useState(new MdlQuestion());
  const [category, setCategory] = useState(mdl._category || "");
  const [caption, setCaption] = useState(mdl._caption || "");
  const [specification, setSpecification] = useState(
    mdl._specification || initSpecification
  );
  const [definition, setDefinition] = useState(
    mdl._definition || initDefinition
  );
  const [argsAndAnswer, setArgsAndAnswer] = useState(
    mdl._args_and_answer || initArgsAndAnswer
  );

  useEffect(() => {
    MdlQuestion.get(params.id).then((mdl) => {
      setCategory(mdl._category);
      setCaption(mdl._caption);
      setSpecification(mdl._specification);
      setDefinition(mdl._definition);
      setArgsAndAnswer(mdl._args_and_answer);
      setMdl(mdl);
    });
  }, [params.id]);

  const onRegistClicked = async () => {
    mdl._category = category;
    mdl._caption = caption;
    mdl._specification = specification;
    mdl._definition = definition;
    mdl._args_and_answer = argsAndAnswer;
    await mdl.save();
    router.push('/');
  };

  return (
    <div className="w-full pt-6 px-4 sm:px-6 md:px-8 lg:ps-72">
      <div className="max-w-[85rem] mx-auto">
        <p className="mt-10">カテゴリ</p>
        <input
          type="text"
          className="py-3 px-4 block w-full bg-gray-100 border-transparent rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:border-transparent dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <p className="mt-10">キャプション</p>
        <input
          type="text"
          className="py-3 px-4 block w-full bg-gray-100 border-transparent rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:border-transparent dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
        <p className="mt-10">仕様</p>
        <textarea
          className="py-3 px-4 block w-full h-64 bg-gray-100 border-transparent rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:border-transparent dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
          value={specification}
          onChange={(e) => setSpecification(e.target.value)}
        ></textarea>
        <p className="mt-10">関数定義</p>
        <input
          type="text"
          className="py-3 px-4 block w-full bg-gray-100 border-transparent rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:border-transparent dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
          value={definition}
          onChange={(e) => setDefinition(e.target.value)}
        />
        <p className="mt-10">テスト値 & 期待値</p>
        <textarea
          className="py-3 px-4 block w-full h-64 bg-gray-100 border-transparent rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:border-transparent dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
          value={argsAndAnswer}
          onChange={(e) => setArgsAndAnswer(e.target.value)}
        />
        <button
          className="my-4 py-3 px-4 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
          onClick={onRegistClicked}
        >
          登録
        </button>
      </div>
    </div>
  );
}
