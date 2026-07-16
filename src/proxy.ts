import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PREFIXES = ["/login", "/auth", "/accept-invite", "/inactive"];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // API routes manage their own authorization (e.g. CRON_SECRET) — the session/role
  // redirects below are only for browser page navigation.
  if (path.startsWith("/api")) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublic = path === "/" || PUBLIC_PREFIXES.some((p) => path.startsWith(p));

  if (!user) {
    if (!isPublic) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return response;
  }

  // Signed in — look up their profile to enforce invite-completion and role-scoped routes.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role,status")
    .eq("id", user.id)
    .single();

  if (!profile) return response;

  if (profile.status === "inactive" && path !== "/inactive") {
    const url = request.nextUrl.clone();
    url.pathname = "/inactive";
    return NextResponse.redirect(url);
  }

  if (profile.status === "invited" && path !== "/accept-invite") {
    const url = request.nextUrl.clone();
    url.pathname = "/accept-invite";
    return NextResponse.redirect(url);
  }

  const roleAreas = ["admin", "assessor", "candidate"];
  const currentArea = roleAreas.find((area) => path.startsWith(`/${area}`));
  if (currentArea && currentArea !== profile.role) {
    const url = request.nextUrl.clone();
    url.pathname = `/${profile.role}`;
    return NextResponse.redirect(url);
  }

  if (path === "/" || path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname =
      profile.status === "inactive"
        ? "/inactive"
        : profile.status === "invited"
          ? "/accept-invite"
          : `/${profile.role}`;
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
