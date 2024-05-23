import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { withAuth } from "next-auth/middleware"

// export async function middleware(req: NextRequest) {
//   const requestHeaders = new Headers(req.headers)
//   requestHeaders.set('x-pathname', req.nextUrl.pathname)

//   return NextResponse.next({
//     request: {
//       headers: requestHeaders,
//     }
//   })
// }

export default withAuth({
  // Matches the pages config in `[...nextauth]`
  pages: {
    signIn: '/signin',
    newUser: '/signup'
  }
})

export const config = { matcher: [
  '/', 
  '/(admin.*)', 
  '/(question.*)',
] }
// export const config = { matcher: ['/((?!signin).*)'] }
// export const config = { matcher: ['/test'] }