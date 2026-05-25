import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          if (typeof document === "undefined") return [];
          const raw = document.cookie;
          if (!raw) return [];
          return raw
            .split("; ")
            .filter(Boolean)
            .map((cookie) => {
              const eqIdx = cookie.indexOf("=");
              if (eqIdx === -1) return { name: cookie, value: "" };
              const name = cookie.slice(0, eqIdx);
              const value = cookie.slice(eqIdx + 1);
              try {
                return { name, value: decodeURIComponent(value) };
              } catch {
                return { name, value };
              }
            });
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            let cookieString = `${name}=${encodeURIComponent(value)}`;
            if (options) {
              if (options.path) cookieString += `; path=${options.path}`;
              if (options.maxAge) cookieString += `; max-age=${options.maxAge}`;
              if (options.domain) cookieString += `; domain=${options.domain}`;
              if (options.sameSite) cookieString += `; samesite=${options.sameSite}`;
              if (options.secure) cookieString += `; secure`;
            }
            document.cookie = cookieString;
          });
        },
      },
    }
  );
}
