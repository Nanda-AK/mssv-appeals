import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

async function getStats(userRole: string, orgId: string | null) {
  const supabase = await createClient();

  let query = supabase.from("appeals").select("status, priority, next_hearing_date");

  if (userRole === "client" && orgId) {
    query = query.eq("client_org_id", orgId);
  }

  const { data: appeals } = await query;

  const total = appeals?.length ?? 0;
  const pending = appeals?.filter((a) => a.status === "Pending" || a.status === "Appeal Filed").length ?? 0;
  const highPriority = appeals?.filter((a) => a.priority === "high").length ?? 0;

  const today = new Date();
  const next7Days = new Date(today);
  next7Days.setDate(today.getDate() + 7);
  const upcomingHearings = appeals?.filter((a) => {
    if (!a.next_hearing_date) return false;
    const d = new Date(a.next_hearing_date);
    return d >= today && d <= next7Days;
  }).length ?? 0;

  return { total, pending, highPriority, upcomingHearings };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("name, role, org_id")
    .eq("id", user!.id)
    .single();

  const stats = await getStats(profile?.role ?? "staff", profile?.org_id ?? null);

  const cards = [
    {
      label: "Total Appeals",
      value: stats.total,
      color: "bg-[#1E3A5F]",
      textColor: "text-white",
    },
    {
      label: "Active / Pending",
      value: stats.pending,
      color: "bg-white",
      textColor: "text-[#1A1A2E]",
      border: true,
    },
    {
      label: "High Priority",
      value: stats.highPriority,
      color: "bg-white",
      textColor: "text-[#DC2626]",
      border: true,
    },
    {
      label: "Hearings (next 7 days)",
      value: stats.upcomingHearings,
      color: "bg-white",
      textColor: "text-[#D97706]",
      border: true,
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#1A1A2E]">
          Welcome back, {profile?.name?.split(" ")[0] ?? "there"}
        </h1>
        <p className="text-[#6B7280] text-sm mt-1">
          Here's an overview of your appeals portfolio.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`rounded-xl p-5 ${card.color} ${card.border ? "border border-[#E5E7EB] shadow-sm" : ""}`}
          >
            <p className={`text-3xl font-bold ${card.textColor}`}>{card.value}</p>
            <p className={`text-sm mt-1 ${card.color === "bg-[#1E3A5F]" ? "text-white/70" : "text-[#6B7280]"}`}>
              {card.label}
            </p>
          </div>
        ))}
      </div>

      {/* Quick action */}
      <div className="flex items-center gap-4">
        <Link
          href="/appeals"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1E3A5F] hover:bg-[#162d4a] text-white text-sm font-medium rounded-lg transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          View All Appeals
        </Link>
        {(profile?.role === "admin" || profile?.role === "staff") && (
          <Link
            href="/appeals/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#E5E7EB] bg-white hover:bg-[#F8F9FA] text-[#1A1A2E] text-sm font-medium rounded-lg transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Appeal
          </Link>
        )}
      </div>
    </div>
  );
}
