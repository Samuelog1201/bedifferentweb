import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const email = data?.claims?.email;

  if (error || typeof email !== "string" || email.toLowerCase() !== process.env.ADMIN_EMAIL?.toLowerCase()) {
    redirect("/admin/login");
  }

  return { email };
}
