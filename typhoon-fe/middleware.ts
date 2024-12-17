import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
export { default } from "next-auth/middleware";

export async function middleware(req: NextRequest) {

  const token = await getToken({ req });

  if (token) {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL("/api/auth/signin", req.nextUrl).toString());
}

export const config = {
  matcher: ["/((?!api/auth/*|public|_next|favicon.ico).*)"],
};
