import { type NextRequest, NextResponse } from "next/server";

export async function proxy(_request: NextRequest) {
  // Ultra-fast pass-through proxy for Next.js 16
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets and image optimization files.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
