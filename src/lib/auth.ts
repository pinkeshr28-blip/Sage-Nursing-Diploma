import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database, UserRole } from "@/lib/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export async function getSessionProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile ?? null;
}

/** Redirects to /login, /accept-invite, or the caller's own dashboard if role doesn't match. */
export async function requireRole(role: UserRole): Promise<Profile> {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  if (profile.status === "invited") redirect("/accept-invite");
  if (profile.role !== role) redirect(`/${profile.role}`);
  return profile;
}
