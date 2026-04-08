"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Appeal, APPEAL_STATUSES, PRIORITIES } from "@/lib/types";

interface SelectOption {
  id: string;
  name: string;
}

interface Props {
  appeals: Appeal[];
  clients: SelectOption[];
  staffUsers: SelectOption[];
  userRole: string;
  filters: { [key: string]: string | undefined };
}

const priorityColors: Record<string, string> = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-green-50 text-green-700 border-green-200",
};

const statusColors: Record<string, string> = {
  "Pending": "bg-gray-100 text-gray-700",
  "Appeal Filed": "bg-blue-50 text-blue-700",
  "Hearing Scheduled": "bg-[#EEF2FF] text-[#4A6FA5]",
  "Adjourned": "bg-amber-50 text-amber-700",
  "Decided - Allowed": "bg-green-50 text-green-700",
  "Decided - Dismissed": "bg-red-50 text-red-700",
  "Decided - Partially Allowed": "bg-purple-50 text-purple-700",
  "Withdrawn": "bg-gray-100 text-gray-500",
  "Closed": "bg-gray-100 text-gray-500",
};

export default function AppealsTable({ appeals, clients, staffUsers, userRole, filters }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v && k !== key) params.set(k, v);
    });
    if (value) params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearFilters() {
    router.push(pathname);
  }

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div>
      {/* Filters */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 mb-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-end">
          {userRole !== "client" && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#6B7280]">Client</label>
              <select
                value={filters.client ?? ""}
                onChange={(e) => updateFilter("client", e.target.value)}
                className="text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] min-w-[160px]"
              >
                <option value="">All Clients</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#6B7280]">Status</label>
            <select
              value={filters.status ?? ""}
              onChange={(e) => updateFilter("status", e.target.value)}
              className="text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] min-w-[160px]"
            >
              <option value="">All Statuses</option>
              {APPEAL_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {userRole !== "client" && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#6B7280]">Assigned To</label>
              <select
                value={filters.assigned ?? ""}
                onChange={(e) => updateFilter("assigned", e.target.value)}
                className="text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] min-w-[140px]"
              >
                <option value="">All Staff</option>
                {staffUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#6B7280]">A.Y.</label>
            <input
              type="text"
              placeholder="e.g. 2022-23"
              value={filters.ay ?? ""}
              onChange={(e) => updateFilter("ay", e.target.value)}
              className="text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] w-28"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#6B7280]">Priority</label>
            <select
              value={filters.priority ?? ""}
              onChange={(e) => updateFilter("priority", e.target.value)}
              className="text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] min-w-[120px]"
            >
              <option value="">All</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-[#6B7280] hover:text-[#1A1A2E] underline underline-offset-2 pb-2"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-[#E5E7EB]">
                <th className="text-left px-4 py-3 font-medium text-[#6B7280] whitespace-nowrap">Appeal No.</th>
                <th className="text-left px-4 py-3 font-medium text-[#6B7280] whitespace-nowrap">Client</th>
                <th className="text-left px-4 py-3 font-medium text-[#6B7280] whitespace-nowrap">A.Y.</th>
                <th className="text-left px-4 py-3 font-medium text-[#6B7280] whitespace-nowrap">Proceedings</th>
                <th className="text-left px-4 py-3 font-medium text-[#6B7280] whitespace-nowrap">Status</th>
                <th className="text-left px-4 py-3 font-medium text-[#6B7280] whitespace-nowrap">Priority</th>
                <th className="text-left px-4 py-3 font-medium text-[#6B7280] whitespace-nowrap">Next Hearing</th>
                <th className="text-left px-4 py-3 font-medium text-[#6B7280] whitespace-nowrap">Assigned To</th>
                <th className="text-left px-4 py-3 font-medium text-[#6B7280] whitespace-nowrap">File</th>
                <th className="text-left px-4 py-3 font-medium text-[#6B7280] whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {appeals.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-[#6B7280]">
                    No appeals found.
                  </td>
                </tr>
              ) : (
                appeals.map((appeal) => (
                  <tr key={appeal.id} className="hover:bg-[#F8F9FA] transition-colors">
                    <td className="px-4 py-3 font-medium text-[#1A1A2E] whitespace-nowrap">
                      {appeal.appeal_number}
                    </td>
                    <td className="px-4 py-3 text-[#1A1A2E] whitespace-nowrap">
                      {appeal.client_org?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-[#6B7280] whitespace-nowrap">
                      {appeal.assessment_year ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-[#6B7280] whitespace-nowrap">
                      {appeal.type_of_proceedings ?? "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[appeal.status] ?? "bg-gray-100 text-gray-700"}`}>
                        {appeal.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${priorityColors[appeal.priority] ?? ""}`}>
                        {appeal.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#6B7280] whitespace-nowrap">
                      {appeal.next_hearing_date
                        ? new Date(appeal.next_hearing_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-[#6B7280] whitespace-nowrap">
                      {appeal.assigned_user?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {appeal.file_url ? (
                        <a
                          href={appeal.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#4A6FA5] hover:text-[#1E3A5F] text-xs font-medium"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          View
                        </a>
                      ) : (
                        <span className="text-[#E5E7EB] text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link
                        href={`/appeals/${appeal.id}`}
                        className="text-[#4A6FA5] hover:text-[#1E3A5F] text-xs font-medium"
                      >
                        {userRole === "client" ? "View" : "Edit"}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
