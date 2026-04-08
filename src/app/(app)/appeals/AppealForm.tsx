"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Appeal, APPEAL_STATUSES, PROCEEDINGS_TYPES, CASE_TYPES, PRIORITIES } from "@/lib/types";

interface SelectOption {
  id: string;
  name: string;
}

interface Props {
  appeal?: Appeal;
  clients: SelectOption[];
  staffUsers: SelectOption[];
  isReadOnly?: boolean;
}

export default function AppealForm({ appeal, clients, staffUsers, isReadOnly = false }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = !!appeal;

  const [form, setForm] = useState({
    appeal_number: appeal?.appeal_number ?? "",
    client_org_id: appeal?.client_org_id ?? "",
    assigned_to: appeal?.assigned_to ?? "",
    status: appeal?.status ?? "Pending",
    case_type: appeal?.case_type ?? "",
    type_of_proceedings: appeal?.type_of_proceedings ?? "",
    assessment_year: appeal?.assessment_year ?? "",
    section: appeal?.section ?? "",
    priority: appeal?.priority ?? "medium",
    outcome: appeal?.outcome ?? "",
    filing_date: appeal?.filing_date ?? "",
    next_hearing_date: appeal?.next_hearing_date ?? "",
    notes: appeal?.notes ?? "",
  });

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let file_url = appeal?.file_url ?? null;

      // Upload PDF if selected
      if (file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("appeal-documents")
          .upload(fileName, file, { upsert: true });

        if (uploadError) throw new Error(uploadError.message);

        const { data: urlData } = supabase.storage
          .from("appeal-documents")
          .getPublicUrl(uploadData.path);

        file_url = urlData.publicUrl;
      }

      const payload = {
        ...form,
        assigned_to: form.assigned_to || null,
        outcome: form.outcome || null,
        filing_date: form.filing_date || null,
        next_hearing_date: form.next_hearing_date || null,
        notes: form.notes || null,
        file_url,
        updated_at: new Date().toISOString(),
      };

      if (isEdit) {
        const { error: updateError } = await supabase
          .from("appeals")
          .update(payload)
          .eq("id", appeal!.id);
        if (updateError) throw new Error(updateError.message);
      } else {
        const { error: insertError } = await supabase
          .from("appeals")
          .insert({ ...payload, created_at: new Date().toISOString() });
        if (insertError) throw new Error(insertError.message);
      }

      router.push("/appeals");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = `w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-[#1A1A2E] text-sm placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent transition ${isReadOnly ? "bg-[#F8F9FA] cursor-default" : "bg-white"}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Section: Basic Info */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm p-6">
        <h2 className="text-base font-semibold text-[#1A1A2E] mb-5">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">Appeal Number *</label>
            <input name="appeal_number" value={form.appeal_number} onChange={handleChange} required readOnly={isReadOnly} className={inputClass} placeholder="e.g. ITA/2023/DEL/1234" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">Client *</label>
            <select name="client_org_id" value={form.client_org_id} onChange={handleChange} required disabled={isReadOnly} className={inputClass}>
              <option value="">Select client…</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">Assessment Year</label>
            <input name="assessment_year" value={form.assessment_year} onChange={handleChange} readOnly={isReadOnly} className={inputClass} placeholder="e.g. 2022-23" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">Section</label>
            <input name="section" value={form.section} onChange={handleChange} readOnly={isReadOnly} className={inputClass} placeholder="e.g. 143(3)" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">Case Type</label>
            <select name="case_type" value={form.case_type} onChange={handleChange} disabled={isReadOnly} className={inputClass}>
              <option value="">Select…</option>
              {CASE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">Type of Proceedings</label>
            <select name="type_of_proceedings" value={form.type_of_proceedings} onChange={handleChange} disabled={isReadOnly} className={inputClass}>
              <option value="">Select…</option>
              {PROCEEDINGS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Section: Status & Assignment */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm p-6">
        <h2 className="text-base font-semibold text-[#1A1A2E] mb-5">Status & Assignment</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">Status *</label>
            <select name="status" value={form.status} onChange={handleChange} required disabled={isReadOnly} className={inputClass}>
              {APPEAL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">Priority</label>
            <select name="priority" value={form.priority} onChange={handleChange} disabled={isReadOnly} className={inputClass}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">Assigned To</label>
            <select name="assigned_to" value={form.assigned_to} onChange={handleChange} disabled={isReadOnly} className={inputClass}>
              <option value="">Unassigned</option>
              {staffUsers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">Outcome</label>
            <input name="outcome" value={form.outcome} onChange={handleChange} readOnly={isReadOnly} className={inputClass} placeholder="Leave blank if pending" />
          </div>
        </div>
      </div>

      {/* Section: Dates */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm p-6">
        <h2 className="text-base font-semibold text-[#1A1A2E] mb-5">Dates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">Filing Date</label>
            <input type="date" name="filing_date" value={form.filing_date} onChange={handleChange} readOnly={isReadOnly} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">Next Hearing Date</label>
            <input type="date" name="next_hearing_date" value={form.next_hearing_date} onChange={handleChange} readOnly={isReadOnly} className={inputClass} />
          </div>
        </div>
      </div>

      {/* Section: Notes & Document */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm p-6">
        <h2 className="text-base font-semibold text-[#1A1A2E] mb-5">Notes & Document</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              readOnly={isReadOnly}
              rows={4}
              className={inputClass}
              placeholder="Any additional notes…"
            />
          </div>
          {!isReadOnly && (
            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                Attach PDF {appeal?.file_url ? "(replaces existing)" : ""}
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-[#6B7280] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#1E3A5F] file:text-white hover:file:bg-[#162d4a] file:cursor-pointer cursor-pointer"
              />
            </div>
          )}
          {appeal?.file_url && (
            <a
              href={appeal.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#4A6FA5] hover:text-[#1E3A5F] text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              View attached document
            </a>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!isReadOnly && (
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-[#1E3A5F] hover:bg-[#162d4a] disabled:opacity-60 text-white text-sm font-medium rounded-lg transition"
          >
            {loading ? "Saving…" : isEdit ? "Save Changes" : "Create Appeal"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 border border-[#E5E7EB] bg-white hover:bg-[#F8F9FA] text-[#1A1A2E] text-sm font-medium rounded-lg transition"
          >
            Cancel
          </button>
        </div>
      )}
    </form>
  );
}
