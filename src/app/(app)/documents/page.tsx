import { createClient } from "@/lib/supabase/server";
import DocumentsClient from "./DocumentsClient";

export const revalidate = 120;

export default async function DocumentsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user!.id)
    .single();

  const [{ data: forms }, { data: templates }] = await Promise.all([
    supabase.from("forms").select("*").order("sort_order", { ascending: true }),
    supabase.from("templates").select("*").order("created_at", { ascending: true }),
  ]);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#1A1A2E]">Documents</h1>
        <p className="text-[#6B7280] text-sm mt-0.5">Forms reference and templates library</p>
      </div>
      <DocumentsClient
        forms={forms ?? []}
        templates={templates ?? []}
        userRole={profile?.role ?? "staff"}
      />
    </div>
  );
}
