import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";

export default async function Home() {
  const profile = await getSessionProfile();

  if (!profile) redirect("/login");
  if (profile.status === "inactive") redirect("/inactive");
  if (profile.status === "invited") redirect("/accept-invite");
  redirect(`/${profile.role}`);
}
