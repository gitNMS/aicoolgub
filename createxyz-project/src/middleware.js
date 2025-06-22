import { NextResponse } from "next/server";

export const config = {
  matcher: "/integrations/:path*",
};

export function middleware(request) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-createxyz-project-id", "d2744a0b-bdaa-457b-bdcc-0781fe0544cf");
  requestHeaders.set("x-createxyz-project-group-id", "708f314c-dfc8-45a4-8127-925484986cd1");


  request.nextUrl.href = `https://www.create.xyz/${request.nextUrl.pathname}`;

  return NextResponse.rewrite(request.nextUrl, {
    request: {
      headers: requestHeaders,
    },
  });
}