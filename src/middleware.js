import { NextResponse } from "next/server";

export default function middleware(req) {
  const url = req.nextUrl.pathname;

  // ✅ Թույլատրված էջեր առանց authentication
  const publicRoutes = ["/", "/reset-password", "/welcome"];
  if (publicRoutes.includes(url) || url.startsWith("/_next") || url.startsWith("/static") || url.startsWith("/public") ) {
    return NextResponse.next();
  }

  // ✅ Թույլ ենք տալիս API request-ները
  if (url.startsWith("/api")) {
    return NextResponse.next();
  }

  // ✅ Ստուգում ենք՝ user-ը լոգին եղե՞լ է
  const token = req.cookies.get("authToken");
  if (!token) {
    return NextResponse.redirect(new URL("/welcome", req.url)); // ❗ Եթե login չեղած է, տանում է /welcome
  }

  return NextResponse.next();
}

// export default function middleware(req) {
//   const url = req.nextUrl.pathname;
//   const token = req.cookies.get("authToken");

//   // ✅ Թույլատրում ենք welcome, login, register, և reset-password էջերը առանց authentication-ի
//   if (url.startsWith("/welcome") || url.startsWith("/login") || url.startsWith("/register") || url.startsWith("/reset-password")) {
//     return NextResponse.next();
//   }

//   // ✅ Եթե user-ը login չի, միայն protected էջերի դեպքում տանում ենք login
//   if (!token) {
//     return NextResponse.redirect(new URL("/welcome", req.url));
//   }

//   return NextResponse.next();
// }



