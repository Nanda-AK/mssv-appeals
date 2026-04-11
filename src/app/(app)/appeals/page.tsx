import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/user";
import Link from "next/link";
import AppealsTable from "./AppealsTable";
import { Appeal } from "@/lib/types";

interface SelectOption { id: string; name: string; }

const PAGE_SIZE = 50;

export default async function AppealsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const profile = await getCurrentUser();
  const role = profile?.role ?? "staff";
  const orgId = profile?.org_id;

  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // Fetch filter options
  const [{ data: clients }, { data: staffUsers }] = await Promise.all([
    supabase.from("organizations").select("id, name").eq("type", "client").order("name"),
    supabase.from("users").select("id, name").in("role", ["admin", "staff"]).order("name"),
  ]);

  // Build appeals query
  let query = supabase
    .from("appeals")
    .select(`
      *,
      client_org:organizations!client_org_id(id, name),
      assigned_user:users!assigned_to(id, name)
    `, { count: "exact" })
    .order("next_hearing_date", { ascending: true, nullsFirst: false })
    .range(from, to);

  // Client role filter
  if (role === "client" && orgId) {
    query = query.eq("client_org_id", orgId);
  }

  // Apply filters from query params
  if (params.client) query = query.eq("client_org_id", params.client);
  if (params.status) query = query.eq("status", params.status);
  if (params.assigned) query = query.eq("assigned_to", params.assigned);
  if (params.ay) query = query.eq("assessment_year", params.ay);
  if (params.priority) query = query.eq("priority", params.priority);

  const { data: appeals, count } = await query;

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A2E]">Appeals</h1>
          <p className="text-[#6B7280] text-sm mt-0.5">
            {count ?? 0} records
          </p>
        </div>
        {(role === "admin" || role === "staff") && (
          <Link
            href="/appeals/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1E3A5F] hover:bg-[#162d4a] text-white text-sm font-medium rounded-lg transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Appeal
          </Link>
        )}
      </div>

      <AppealsTable
        appeals={(appeals as Appeal[]) ?? []}
        clients={(clients as SelectOption[]) ?? []}
        staffUsers={(staffUsers as SelectOption[]) ?? []}
        userRole={role}
        filters={params}
        page={page}
        totalPages={totalPages}
        totalCount={count ?? 0}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
