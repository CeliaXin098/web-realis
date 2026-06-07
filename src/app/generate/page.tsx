import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function GeneratePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth?next=/generate");
  }

  redirect("/reflect");
}
