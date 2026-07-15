"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/database.types";

type ActionResult = { error?: string; success?: boolean };

export async function inviteUser(formData: FormData): Promise<ActionResult> {
  const admin = await requireRole("admin");

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "") as UserRole;
  const cohortId = role === "candidate" ? String(formData.get("cohort_id") ?? "") || null : null;

  if (!email || !email.includes("@")) return { error: "Enter a valid email address." };
  if (role !== "assessor" && role !== "candidate") return { error: "Choose a role." };
  if (role === "candidate" && !cohortId) return { error: "Select a cohort for this candidate." };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const supabaseAdmin = createAdminClient();

  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/accept-invite`,
    data: { role, cohort_id: cohortId },
  });

  if (error) return { error: error.message };
  if (!data.user) return { error: "Invite failed — no user returned." };

  const { error: profileError } = await supabaseAdmin.from("profiles").insert({
    id: data.user.id,
    email,
    role,
    cohort_id: cohortId,
    status: "invited",
    invited_by: admin.id,
  });

  if (profileError) return { error: profileError.message };

  revalidatePath("/admin/people");
  return { success: true };
}

export async function addUnit(title: string): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("units")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.sort_order ?? 0) + 1;

  const { error } = await supabase.from("units").insert({
    title: title.trim() || `Unit ${nextOrder}`,
    sort_order: nextOrder,
    published: false,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/config");
  return { success: true };
}

export async function renameUnit(unitId: string, title: string): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();
  const trimmed = title.trim();
  if (!trimmed) return { error: "Unit name can't be empty." };

  const { error } = await supabase.from("units").update({ title: trimmed }).eq("id", unitId);
  if (error) return { error: error.message };
  revalidatePath("/admin/config");
  return { success: true };
}

export async function toggleUnitPublish(unitId: string, published: boolean): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();

  const { error } = await supabase.from("units").update({ published }).eq("id", unitId);
  if (error) return { error: error.message };
  revalidatePath("/admin/config");
  return { success: true };
}

export async function addQuestion(
  unitId: string,
  section: "knowledge" | "performance",
  label: string,
): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("unit_questions")
    .select("sort_order")
    .eq("unit_id", unitId)
    .eq("section", section)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.sort_order ?? 0) + 1;
  const prefix = section === "knowledge" ? "1." : "2.";

  const { error } = await supabase.from("unit_questions").insert({
    unit_id: unitId,
    section,
    label: label.trim() || `${prefix}${nextOrder}`,
    sort_order: nextOrder,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/config");
  return { success: true };
}

export async function updateQuestionLabel(questionId: string, label: string): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();
  const trimmed = label.trim();
  if (!trimmed) return { error: "Question label can't be empty." };

  const { error } = await supabase
    .from("unit_questions")
    .update({ label: trimmed })
    .eq("id", questionId);

  if (error) return { error: error.message };
  revalidatePath("/admin/config");
  return { success: true };
}

export async function removeQuestion(questionId: string): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();

  const { error } = await supabase.from("unit_questions").delete().eq("id", questionId);
  if (error) return { error: error.message };
  revalidatePath("/admin/config");
  return { success: true };
}
