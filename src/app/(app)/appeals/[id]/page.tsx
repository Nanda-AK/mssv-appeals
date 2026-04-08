import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import AppealForm from "../AppealForm";
import { Appeal } from "@/lib/types";

export default async function AppealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user!.id)
    .single();

  const { data: appeal } = await supabase
    .from("appeals")
    .select(`*, client_org:organizations!client_org_id(id, name), assigned_user:users!assigned_to(id, name)`)
    .eq("id", id)
    .single();

  if (!appeal) notFound();

  const isReadOnly = profile?.role === "client";

  const [{ data: clients }, { data: staffUsers }] = await Promise.all([
    supabase.from("organizations").select("id, name").eq("type", "client").order("name"),
    supabase.from("users").select("id, name").in("role", ["admin", "staff"]).order("name"),
  ]);

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#1A1A2E]">{appeal.appeal_number}</h1>
            <p className="text-[#6B7280] text-sm mt-0.5">
              {appeal.client_org?.name} · {appeal.assessment_year ?? "AY not set"}
            </p>
          </div>
          {isReadOnly && (
            <span className="text-xs text-[#6B7280] border border-[#E5E7EB] rounded-full px-3 py-1">View only</span>
          )}
        </div>
      </div>
      <AppealForm
        appeal={appeal as Appeal}
        clients={(clients ?? []) as { id: string; name: string }[]}
        staffUsers={(staffUsers ?? []) as { id: string; name: string }[]}
        isReadOnly={isReadOnly}
      />
    </div>
  );
}
