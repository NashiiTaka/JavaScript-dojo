// サーバー側ロジック APIエンドポイントが自動生成される
'use server';

// ルートのキャッシュをクリアし、再読み込みをかける
import { revalidatePath } from 'next/cache';
// リダイレクト
import { redirect } from 'next/navigation';

// プログラムで設定するキーを削除
export async function revalidateAndRedirectPath(path: string, pathRedirectTo: string | undefined = undefined) {
  // このパスのキャッシュをクリア
  revalidatePath(path);
  // リダイレクト
  redirect(pathRedirectTo || path);
}
