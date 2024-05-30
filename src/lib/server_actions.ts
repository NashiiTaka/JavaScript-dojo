// サーバー側ロジック APIエンドポイントが自動生成される
'use server';

// ルートのキャッシュをクリアし、再読み込みをかける
import { revalidatePath } from 'next/cache';
// リダイレクト
import { redirect } from 'next/navigation';

export async function revalidateAndRedirectPath(path: string, pathRedirectTo: string | undefined = undefined) {
  // このパスのキャッシュをクリア
  revalidatePath(path);
  // リダイレクト
  redirect(pathRedirectTo || path);
}

export async function revalidatePathSv(path: string) {
  // このパスのキャッシュをクリア
  revalidatePath(path);
}

export async function redirectSv(path: string) {
  // リダイレクト
  redirect(path);
}