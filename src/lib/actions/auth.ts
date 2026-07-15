"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function completeInvite(fullName: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const trimmed = fullName.trim();
  if (!trimmed) {
    return { error: "Please enter your full name." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: trimmed, status: "active" })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  redirect(`/${profile?.role ?? "login"}`);
}
