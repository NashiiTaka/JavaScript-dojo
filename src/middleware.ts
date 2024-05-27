import { auth  } from "@/lib/auth";
export default auth((req) => {
  // req.auth
  if(!req.auth){
    return Response.redirect(new URL('/signin', req.nextUrl));
  }
  else if(!req.auth?.user.nickname && !req.nextUrl.pathname.startsWith('/regist')){
    // ニックネーム未登録の場合は、ニックネームの登録ページに遷移させる。
    console.log('middleware: redirect to regist becase nickname is undefined');
    return Response.redirect(new URL('/regist', req.nextUrl));
  }
});



// import { pathToFileURL } from 'url';

// 次のURIをヘッダにいれる
// サーバーサイドでリクエストURIがわからない為。
// export async function middleware(req: NextRequest) {
//   const requestHeaders = new Headers(req.headers)
//   requestHeaders.set('x-pathname', req.nextUrl.pathname)

//   return NextResponse.next({
//     request: {
//       headers: requestHeaders,
//     }
//   })
// }


// export default withAuth({
//   // Matches the pages config in `[...nextauth]`
//   pages: {
//     signIn: '/signin',
//     newUser: '/signup',
//   }
// })


export const config = { matcher: [
  '/', 
  '/(admin.*)', 
  '/(question.*)',
] }
// @see https://clerk.com/docs/references/nextjs/auth-middleware
// export const config = { 
//   macher: ["/", "/(questions).*", "/(admin).*"]
// }

// export const config = { 
//   macher: ["/((?!api|_next/static|_next/image|favicon.ico|sign).*)"]
// }
// export const config = { matcher: ['/((?!signin).*)'] }
// export const config = { matcher: ['/test'] }

