import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import UsersClient from "./UsersClient";

export const revalidate = 60; // cache for 60 seconds

export default async function UsersPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user!.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  const [{ data: users }, { data: organizations }] = await Promise.all([
    supabase
      .from("users")
      .select("*, organization:organizations!org_id(id, name, type)")
      .order("name"),
    supabase.from("organizations").select("id, name, type").order("name"),
  ]);

  const spUsers = (users ?? []).filter((u) => u.organization?.type === "service_provider");
  const clientUsers = (users ?? []).filter((u) => u.organization?.type === "client");
  const clientOrgs = (organizations ?? []).filter((o) => o.type === "client");

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#1A1A2E]">Users</h1>
        <p className="text-[#6B7280] text-sm mt-0.5">{users?.length ?? 0} users</p>
      </div>
      <UsersClient
        spUsers={spUsers}
        clientUsers={clientUsers}
        clientOrgs={clientOrgs}
        allOrganizations={organizations ?? []}
      />
    </div>
  );
}
