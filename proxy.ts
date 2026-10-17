import { auth } from "@/lib/auth/server";

// Every page in this app shows personal health data, so there's no genuinely
// public route to allow through. The matcher excludes the auth pages, the
// auth API, and static assets only — everything else requires a session.
export default auth.middleware({ loginUrl: "/auth/sign-in" });

export const config = {
  matcher: ["/((?!auth|api/auth|_next/static|_next/image|favicon.ico).*)"],
};
