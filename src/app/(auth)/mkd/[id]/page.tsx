import MyMarkdonw from "@/cmp/MyMarkdonw";

const markdownStrings: { [key: string]: string } = {
  functionNamesVariations:
    `関数は他の名前でも呼ばれます：

1. **メソッド (Method)**
   - クラスの中で定義される関数。オブジェクト指向プログラミングでは、メソッドという用語がよく使われます。

2. **サブルーチン (Subroutine)**
   - 他のプログラムの一部として呼び出される独立したコードのブロック。特に古い言語（FortranやBASICなど）で使われることが多いです。

3. **プロシージャ (Procedure)**
   - サブルーチンと同様の意味で使われることが多く、特に出力を返さない（値を返さない）場合に使われることがあります。Pascalなどの言語で使用されます。

4. **ルーチン (Routine)**
   - サブルーチンと同義で、汎用的に使われることが多いです。

5. **ラムダ (Lambda)**
   - 無名関数のことを指します。PythonやJavaScriptなど、多くの現代的なプログラミング言語でサポートされています。

6. **コールバック (Callback)**
   - 他の関数によって呼び出されることを前提にした関数。イベント駆動型プログラミングや非同期処理でよく使われます。

7. **クロージャ (Closure)**
   - 関数とその環境を一緒に保持するオブジェクト。内部関数が外部関数の変数にアクセスできる仕組みを指します。

8. **ハンドラ (Handler)**
   - 特定のイベントや条件が発生したときに実行される関数。例として、イベントハンドラ（イベント駆動プログラミング）があります。

9. **ファンクション (Function)**
   - 最も一般的な呼び方で、特定の入力に対して特定の出力を返すコードのブロック。

10. **操作 (Operation)**
    - 特定の演算や処理を行う関数を指すことがあります。数学的な文脈で使われることが多いです。

これらの呼び方は、使用されるプログラミング言語やコンテキストによって異なることがあります。
`}

export default function Mkd({ params }: { params: { id: string; } }) {
  return (
    <MyMarkdonw>
      {markdownStrings[params.id]}
    </MyMarkdonw>
  )
}