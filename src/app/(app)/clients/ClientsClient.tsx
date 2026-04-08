"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Organization } from "@/lib/types";

const blankForm = { name: "", pan: "", tan: "", gst: "", contact_person: "", phone: "" };

export default function ClientsClient({ clients }: { clients: Organization[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [showModal, setShowModal] = useState(false);
  const [editClient, setEditClient] = useState<Organization | null>(null);
  const [form, setForm] = useState(blankForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openAdd() {
    setEditClient(null);
    setForm(blankForm);
    setShowModal(true);
  }

  function openEdit(client: Organization) {
    setEditClient(client);
    setForm({
      name: client.name,
      pan: client.pan ?? "",
      tan: client.tan ?? "",
      gst: client.gst ?? "",
      contact_person: client.contact_person ?? "",
      phone: client.phone ?? "",
    });
    setShowModal(true);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = { ...form, type: "client" as const };
      if (editClient) {
        const { error } = await supabase.from("organizations").update(payload).eq("id", editClient.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("organizations").insert(payload);
        if (error) throw new Error(error.message);
      }
      setShowModal(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    { label: "Organization Name", name: "name", placeholder: "ABC Pvt. Ltd.", required: true },
    { label: "PAN", name: "pan", placeholder: "ABCDE1234F" },
    { label: "TAN", name: "tan", placeholder: "DELA12345B" },
    { label: "GST", name: "gst", placeholder: "27AAPFU0939F1ZV" },
    { label: "Contact Person", name: "contact_person", placeholder: "Rajesh Sharma" },
    { label: "Phone", name: "phone", placeholder: "+91 98765 43210" },
  ];

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1E3A5F] hover:bg-[#162d4a] text-white text-sm font-medium rounded-lg transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Client
        </button>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F8F9FA] border-b border-[#E5E7EB]">
              <th className="text-left px-4 py-3 font-medium text-[#6B7280]">Name</th>
              <th className="text-left px-4 py-3 font-medium text-[#6B7280]">PAN</th>
              <th className="text-left px-4 py-3 font-medium text-[#6B7280]">TAN</th>
              <th className="text-left px-4 py-3 font-medium text-[#6B7280]">GST</th>
              <th className="text-left px-4 py-3 font-medium text-[#6B7280]">Contact</th>
              <th className="text-left px-4 py-3 font-medium text-[#6B7280]">Phone</th>
              <th className="text-left px-4 py-3 font-medium text-[#6B7280]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {clients.map((c) => (
              <tr key={c.id} className="hover:bg-[#F8F9FA] transition-colors">
                <td className="px-4 py-3 font-medium text-[#1A1A2E]">{c.name}</td>
                <td className="px-4 py-3 text-[#6B7280] font-mono text-xs">{c.pan ?? "—"}</td>
                <td className="px-4 py-3 text-[#6B7280] font-mono text-xs">{c.tan ?? "—"}</td>
                <td className="px-4 py-3 text-[#6B7280] font-mono text-xs">{c.gst ?? "—"}</td>
                <td className="px-4 py-3 text-[#6B7280]">{c.contact_person ?? "—"}</td>
                <td className="px-4 py-3 text-[#6B7280]">{c.phone ?? "—"}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => openEdit(c)}
                    className="text-[#4A6FA5] hover:text-[#1E3A5F] text-xs font-medium"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[#1A1A2E]">
                {editClient ? "Edit Client" : "Add Client"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-[#6B7280] hover:text-[#1A1A2E]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {fields.map((f) => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-[#1A1A2E] mb-1">{f.label}</label>
                  <input
                    name={f.name}
                    value={(form as Record<string, string>)[f.name]}
                    onChange={handleChange}
                    required={f.required}
                    placeholder={f.placeholder}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#1A1A2E] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                  />
                </div>
              ))}
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-[#1E3A5F] hover:bg-[#162d4a] disabled:opacity-60 text-white text-sm font-medium rounded-lg transition">
                  {loading ? "Saving…" : editClient ? "Save Changes" : "Add Client"}
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
