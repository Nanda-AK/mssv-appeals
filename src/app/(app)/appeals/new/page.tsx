import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppealForm from "../AppealForm";

export default async function NewAppealPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user!.id)
    .single();

  if (profile?.role === "client") redirect("/appeals");

  const [{ data: clients }, { data: staffUsers }] = await Promise.all([
    supabase.from("organizations").select("id, name").eq("type", "client").order("name"),
    supabase.from("users").select("id, name").in("role", ["admin", "staff"]).order("name"),
  ]);

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#1A1A2E]">New Appeal</h1>
        <p className="text-[#6B7280] text-sm mt-0.5">Fill in the details to create a new appeal record.</p>
      </div>
      <AppealForm clients={(clients ?? []) as { id: string; name: string }[]} staffUsers={(staffUsers ?? []) as { id: string; name: string }[]} />
    </div>
  );
}
