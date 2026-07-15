import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles the PKCE-style `?code=` redirect some Supabase Auth flows use.
// (The hash-fragment style `#access_token=` redirect is handled client-side
// by the browser client's automatic detectSessionInUrl behaviour.)
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
