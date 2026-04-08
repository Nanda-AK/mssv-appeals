"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { User, Organization } from "@/lib/types";

interface Props {
  users: (User & { organization?: Organization })[];
  organizations: Organization[];
}

const roleColors: Record<string, string> = {
  admin: "bg-[#EEF2FF] text-[#4A6FA5]",
  staff: "bg-blue-50 text-blue-700",
  client: "bg-gray-100 text-gray-600",
};

const blankForm = { name: "", email: "", role: "staff", designation: "", org_id: "", password: "" };

export default function UsersClient({ users, organizations }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Create auth user via Supabase admin (requires service role on backend)
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

  return (
    <div>
      <div className="flex justify-end mb-4">
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

      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F8F9FA] border-b border-[#E5E7EB]">
              <th className="text-left px-4 py-3 font-medium text-[#6B7280]">Name</th>
              <th className="text-left px-4 py-3 font-medium text-[#6B7280]">Email</th>
              <th className="text-left px-4 py-3 font-medium text-[#6B7280]">Role</th>
              <th className="text-left px-4 py-3 font-medium text-[#6B7280]">Designation</th>
              <th className="text-left px-4 py-3 font-medium text-[#6B7280]">Organization</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-[#F8F9FA] transition-colors">
                <td className="px-4 py-3 font-medium text-[#1A1A2E]">{u.name}</td>
                <td className="px-4 py-3 text-[#6B7280]">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[u.role] ?? "bg-gray-100"}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#6B7280]">{u.designation ?? "—"}</td>
                <td className="px-4 py-3 text-[#6B7280]">{u.organization?.name ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
                { label: "Email", name: "email", type: "email", placeholder: "ravi@mssv.co", required: true },
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
                  {organizations.map((o) => (
                    <option key={o.id} value={o.id}>{o.name} ({o.type})</option>
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
