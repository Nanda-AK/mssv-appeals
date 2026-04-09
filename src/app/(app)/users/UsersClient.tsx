"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Organization } from "@/lib/types";

interface UserWithOrg extends User {
  organization?: Organization;
}

interface Props {
  spUsers: UserWithOrg[];
  clientUsers: UserWithOrg[];
  clientOrgs: Organization[];
  allOrganizations: Organization[];
}

const roleColors: Record<string, string> = {
  admin: "bg-[#EEF2FF] text-[#4A6FA5]",
  staff: "bg-blue-50 text-blue-700",
  client: "bg-gray-100 text-gray-600",
};

const blankForm = { name: "", email: "", role: "staff", designation: "", org_id: "", password: "" };

export default function UsersClient({ spUsers, clientUsers, clientOrgs, allOrganizations }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"sp" | "client">("sp");
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleOrg(orgId: string) {
    setExpandedOrgs((prev) => {
      const next = new Set(prev);
      next.has(orgId) ? next.delete(orgId) : next.add(orgId);
      return next;
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create user");
      setShowModal(false);
      setForm(blankForm);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // Alternating group header backgrounds
  const groupBg = ["bg-[#F0F4FA]", "bg-[#F5F5F0]"];

  // Group SP users by role
  const spByRole = [
    { role: "admin", label: "Admin", users: spUsers.filter((u) => u.role === "admin") },
    { role: "staff", label: "Staff", users: spUsers.filter((u) => u.role === "staff") },
  ];

  // Group client users by org
  const usersByOrg = clientOrgs.map((org) => ({
    org,
    users: clientUsers.filter((u) => u.org_id === org.id),
  }));

  return (
    <div>
      {/* Tabs + Add button */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-1 bg-[#F0F2F5] p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("sp")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition ${
              activeTab === "sp"
                ? "bg-white text-[#1A1A2E] shadow-sm"
                : "text-[#6B7280] hover:text-[#1A1A2E]"
            }`}
          >
            Service Provider
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${activeTab === "sp" ? "bg-[#EEF2FF] text-[#4A6FA5]" : "bg-white text-[#6B7280]"}`}>
              {spUsers.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("client")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition ${
              activeTab === "client"
                ? "bg-white text-[#1A1A2E] shadow-sm"
                : "text-[#6B7280] hover:text-[#1A1A2E]"
            }`}
          >
            Clients
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${activeTab === "client" ? "bg-[#EEF2FF] text-[#4A6FA5]" : "bg-white text-[#6B7280]"}`}>
              {clientUsers.length}
            </span>
          </button>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1E3A5F] hover:bg-[#162d4a] text-white text-sm font-medium rounded-lg transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add User
        </button>
      </div>

      {/* Service Provider Tab — grouped by role */}
      {activeTab === "sp" && (
        <div className="space-y-2">
          {spByRole.map(({ role, label, users }, idx) => {
            const isExpanded = expandedOrgs.has(role);
            const headerBg = groupBg[idx % groupBg.length];
            return (
              <div key={role} className="border border-[#E5E7EB] rounded-xl shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleOrg(role)}
                  className={`w-full flex items-center justify-between px-5 py-4 ${headerBg} hover:brightness-95 transition-all`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${roleColors[role]}`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        {role === "admin"
                          ? <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          : <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        }
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-[#1A1A2E]">{label}</p>
                      <p className="text-xs text-[#6B7280]">
                        {users.length} {users.length === 1 ? "user" : "users"}
                      </p>
                    </div>
                  </div>
                  <svg
                    className={`w-4 h-4 text-[#6B7280] transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="border-t border-[#E5E7EB]">
                    {users.length === 0 ? (
                      <p className="px-5 py-4 text-sm text-[#6B7280]">No {label.toLowerCase()} users.</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-[#F8F9FA] border-b border-[#E5E7EB]">
                            <th className="text-left px-6 py-2.5 font-medium text-[#6B7280]">Name</th>
                            <th className="text-left px-4 py-2.5 font-medium text-[#6B7280]">Email</th>
                            <th className="text-left px-4 py-2.5 font-medium text-[#6B7280]">Designation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((u, i) => (
                            <tr key={u.id} className={`${i % 2 === 0 ? "bg-white" : "bg-[#F8F9FA]"} hover:bg-[#EEF2FF] transition-colors`}>
                              <td className="px-6 py-3 font-medium text-[#1A1A2E]">{u.name}</td>
                              <td className="px-4 py-3 text-[#6B7280]">{u.email}</td>
                              <td className="px-4 py-3 text-[#6B7280]">{u.designation ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Client Tab — grouped by org */}
      {activeTab === "client" && (
        <div className="space-y-2">
          {usersByOrg.length === 0 ? (
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-10 text-center text-[#6B7280] text-sm">
              No client users found.
            </div>
          ) : (
            usersByOrg.map(({ org, users }, idx) => {
              const isExpanded = expandedOrgs.has(org.id);
              const headerBg = groupBg[idx % groupBg.length];
              return (
                <div key={org.id} className="border border-[#E5E7EB] rounded-xl shadow-sm overflow-hidden">
                  {/* Client header row — clickable */}
                  <button
                    onClick={() => toggleOrg(org.id)}
                    className={`w-full flex items-center justify-between px-5 py-4 ${headerBg} hover:brightness-95 transition-all`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] flex items-center justify-center flex-shrink-0">
                        <span className="text-[#4A6FA5] font-semibold text-sm">
                          {org.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-[#1A1A2E]">{org.name}</p>
                        <p className="text-xs text-[#6B7280]">
                          {users.length} {users.length === 1 ? "user" : "users"}
                        </p>
                      </div>
                    </div>
                    <svg
                      className={`w-4 h-4 text-[#6B7280] transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Expanded users list */}
                  {isExpanded && (
                    <div className="border-t border-[#E5E7EB]">
                      {users.length === 0 ? (
                        <p className="px-5 py-4 text-sm text-[#6B7280]">No users under this client.</p>
                      ) : (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-[#F8F9FA] border-b border-[#E5E7EB]">
                              <th className="text-left px-6 py-2.5 font-medium text-[#6B7280]">Name</th>
                              <th className="text-left px-4 py-2.5 font-medium text-[#6B7280]">Email</th>
                              <th className="text-left px-4 py-2.5 font-medium text-[#6B7280]">Designation</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users.map((u, i) => (
                              <tr key={u.id} className={`${i % 2 === 0 ? "bg-white" : "bg-[#F8F9FA]"} hover:bg-[#EEF2FF] transition-colors`}>
                                <td className="px-6 py-3 font-medium text-[#1A1A2E]">{u.name}</td>
                                <td className="px-4 py-3 text-[#6B7280]">{u.email}</td>
                                <td className="px-4 py-3 text-[#6B7280]">{u.designation ?? "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[#1A1A2E]">Add New User</h2>
              <button onClick={() => setShowModal(false)} className="text-[#6B7280] hover:text-[#1A1A2E]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { label: "Full Name", name: "name", type: "text", placeholder: "Ravi Kumar", required: true },
                { label: "Email", name: "email", type: "email", placeholder: "ravi@example.com", required: true },
                { label: "Password", name: "password", type: "password", placeholder: "Min. 8 characters", required: true },
                { label: "Designation", name: "designation", type: "text", placeholder: "e.g. Senior CA" },
              ].map((f) => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-[#1A1A2E] mb-1">{f.label}</label>
                  <input
                    name={f.name}
                    type={f.type}
                    value={(form as Record<string, string>)[f.name]}
                    onChange={handleChange}
                    required={f.required}
                    placeholder={f.placeholder}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#1A1A2E] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-[#1A1A2E] mb-1">Role</label>
                <select name="role" value={form.role} onChange={handleChange} className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]">
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                  <option value="client">Client</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A2E] mb-1">Organization</label>
                <select name="org_id" value={form.org_id} onChange={handleChange} required className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]">
                  <option value="">Select organization…</option>
                  {allOrganizations.map((o) => (
                    <option key={o.id} value={o.id}>{o.name} ({o.type === "service_provider" ? "Service Provider" : "Client"})</option>
                  ))}
                </select>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-[#1E3A5F] hover:bg-[#162d4a] disabled:opacity-60 text-white text-sm font-medium rounded-lg transition">
                  {loading ? "Creating…" : "Create User"}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-[#E5E7EB] text-[#1A1A2E] text-sm font-medium rounded-lg hover:bg-[#F8F9FA] transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
