import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const cookieNames = request.cookies.getAll().map((c) => c.name);
  console.log("[PROXY] path:", request.nextUrl.pathname, "cookies:", cookieNames.join(","));
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
          if (headers) {
            Object.entries(headers).forEach(([key, value]) =>
              supabaseResponse.headers.set(key, value)
            );
          }
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  console.log("[PROXY] getUser:", user ? `user=${user.email}` : "null", error ? `error=${error.message}` : "");

  if (request.nextUrl.pathname.startsWith("/recipes/create") && !user) {
    console.log("[PROXY] redirecting /recipes/create to /login");
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
