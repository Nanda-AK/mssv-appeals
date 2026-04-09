"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Form {
  id: string;
  rule_no: string;
  rule_heading: string;
  form_no?: string;
  page_no?: string;
  parallel_rule_1962?: string;
  url?: string;
  sort_order: number;
}

interface Template {
  id: string;
  name: string;
  description?: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  created_at: string;
}

interface Props {
  forms: Form[];
  templates: Template[];
  userRole: string;
}

const blankForm: Omit<Form, "id" | "sort_order"> = {
  rule_no: "",
  rule_heading: "",
  form_no: "",
  page_no: "",
  parallel_rule_1962: "",
  url: "",
};

function fileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return { bg: "bg-red-50", text: "text-red-600", label: "PDF" };
  if (ext === "docx" || ext === "doc") return { bg: "bg-blue-50", text: "text-blue-600", label: "DOCX" };
  if (ext === "xlsx" || ext === "xls") return { bg: "bg-green-50", text: "text-green-600", label: "XLSX" };
  return { bg: "bg-gray-100", text: "text-gray-600", label: ext?.toUpperCase() ?? "FILE" };
}

function formatSize(bytes: number) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function cleanFileName(name: string) {
  return name.replace(/\.[^.]+$/, "");
}

export default function DocumentsClient({ forms, templates, userRole }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const isAdmin = userRole === "admin";

  const [activeTab, setActiveTab] = useState<"forms" | "templates">("forms");

  // Forms modal state
  const [showModal, setShowModal] = useState(false);
  const [editingForm, setEditingForm] = useState<Form | null>(null);
  const [formData, setFormData] = useState(blankForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Templates modal state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingFormId, setDeletingFormId] = useState<string | null>(null);

  // Template edit state
  const [showEditTemplateModal, setShowEditTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [editTemplateName, setEditTemplateName] = useState("");
  const [editTemplateDesc, setEditTemplateDesc] = useState("");
  const [editTemplateLoading, setEditTemplateLoading] = useState(false);
  const [editTemplateError, setEditTemplateError] = useState<string | null>(null);

  function openAdd() {
    setEditingForm(null);
    setFormData(blankForm);
    setShowModal(true);
    setError(null);
  }

  function openEdit(f: Form) {
    setEditingForm(f);
    setFormData({
      rule_no: f.rule_no ?? "",
      rule_heading: f.rule_heading ?? "",
      form_no: f.form_no ?? "",
      page_no: f.page_no ?? "",
      parallel_rule_1962: f.parallel_rule_1962 ?? "",
      url: f.url ?? "",
    });
    setShowModal(true);
    setError(null);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        rule_no: formData.rule_no || null,
        rule_heading: formData.rule_heading,
        form_no: formData.form_no || null,
        page_no: formData.page_no || null,
        parallel_rule_1962: formData.parallel_rule_1962 || null,
        url: formData.url || null,
        updated_at: new Date().toISOString(),
      };
      if (editingForm) {
        const { error } = await supabase.from("forms").update(payload).eq("id", editingForm.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("forms").insert({
          ...payload,
          sort_order: forms.length + 1,
          created_at: new Date().toISOString(),
        });
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

  async function handleTemplateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!templateFile) { setTemplateError("Please select a file"); return; }
    setTemplateLoading(true);
    setTemplateError(null);
    try {
      // Upload file to Storage
      const ext = templateFile.name.split(".").pop();
      const fileName = `${Date.now()}_${templateFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("templates")
        .upload(fileName, templateFile, { upsert: false });
      if (uploadError) throw new Error(uploadError.message);
      const { data: urlData } = supabase.storage.from("templates").getPublicUrl(uploadData.path);

      // Save metadata via API route (bypasses RLS)
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName,
          description: templateDesc || null,
          file_url: urlData.publicUrl,
          file_type: ext?.toUpperCase() ?? null,
          file_size: templateFile.size,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save template");

      setShowTemplateModal(false);
      setTemplateName(""); setTemplateDesc(""); setTemplateFile(null);
      router.refresh();
    } catch (err: unknown) {
      setTemplateError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setTemplateLoading(false);
    }
  }

  async function handleDeleteTemplate(id: string) {
    if (!confirm("Are you sure you want to delete this template? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch("/api/templates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete");
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  function openEditTemplate(t: Template) {
    setEditingTemplate(t);
    setEditTemplateName(t.name);
    setEditTemplateDesc(t.description ?? "");
    setEditTemplateError(null);
    setShowEditTemplateModal(true);
  }

  async function handleEditTemplateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTemplate) return;
    setEditTemplateLoading(true);
    setEditTemplateError(null);
    try {
      const res = await fetch("/api/templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingTemplate.id, name: editTemplateName, description: editTemplateDesc }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update");
      setShowEditTemplateModal(false);
      router.refresh();
    } catch (err: unknown) {
      setEditTemplateError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setEditTemplateLoading(false);
    }
  }

  async function handleDeleteForm(id: string) {
    if (!confirm("Are you sure you want to delete this row? This cannot be undone.")) return;
    setDeletingFormId(id);
    try {
      const res = await fetch("/api/forms", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete");
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingFormId(null);
    }
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-1 bg-[#F0F2F5] p-1 rounded-lg">
          {(["forms", "templates"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 text-sm font-medium rounded-md transition capitalize ${
                activeTab === tab
                  ? "bg-white text-[#1A1A2E] shadow-sm"
                  : "text-[#6B7280] hover:text-[#1A1A2E]"
              }`}
            >
              {tab === "forms" ? "Forms" : "Templates"}
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab ? "bg-[#EEF2FF] text-[#4A6FA5]" : "bg-white text-[#6B7280]"}`}>
                {tab === "forms" ? forms.length : templates.length}
              </span>
            </button>
          ))}
        </div>

        {isAdmin && activeTab === "forms" && (
          <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1E3A5F] hover:bg-[#162d4a] text-white text-sm font-medium rounded-lg transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Row
          </button>
        )}
        {isAdmin && activeTab === "templates" && (
          <button onClick={() => { setShowTemplateModal(true); setTemplateError(null); }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1E3A5F] hover:bg-[#162d4a] text-white text-sm font-medium rounded-lg transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Template
          </button>
        )}
      </div>

      {/* ── FORMS TAB ── */}
      {activeTab === "forms" && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm overflow-hidden">
          {/* Table title */}
          <div className="px-6 py-4 border-b border-[#E5E7EB] bg-[#1E3A5F]">
            <p className="text-white font-semibold text-sm text-center tracking-wide">THE INCOME TAX RULES, 2026</p>
            <p className="text-white/70 text-xs text-center mt-0.5">
              Tabular Mapping of Rules and Forms vis-à-vis Rules and Forms under the Income-tax Rules, 1962
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8F9FA] border-b-2 border-[#E5E7EB]">
                  <th className="text-center px-4 py-3 font-semibold text-[#1A1A2E] w-20 border-r border-[#E5E7EB]">Rule No.</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#1A1A2E] border-r border-[#E5E7EB]">Rule Heading</th>
                  <th className="text-center px-4 py-3 font-semibold text-[#1A1A2E] w-24 border-r border-[#E5E7EB]">Form No.</th>
                  <th className="text-center px-4 py-3 font-semibold text-[#1A1A2E] w-24 border-r border-[#E5E7EB]">Page No.</th>
                  <th className="text-center px-4 py-3 font-semibold text-[#1A1A2E] w-40">
                    Parallel Rule under<br />Income-tax Rules, 1962
                  </th>
                  {isAdmin && <th className="w-28 px-4 py-3"></th>}
                </tr>
              </thead>
              <tbody>
                {forms.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="px-4 py-12 text-center text-[#6B7280]">
                      No forms added yet.{isAdmin && " Click \"Add Row\" to get started."}
                    </td>
                  </tr>
                ) : (
                  forms.map((f, i) => (
                    <tr
                      key={f.id}
                      onClick={() => f.url ? window.open(f.url, "_blank") : undefined}
                      className={`border-b border-[#E5E7EB] ${i % 2 === 0 ? "bg-white" : "bg-[#F8F9FA]"} ${f.url ? "cursor-pointer hover:bg-[#EEF2FF]" : "hover:bg-[#F0F4FA]"} transition-colors`}
                    >
                      <td className="px-4 py-3 text-center text-[#1A1A2E] font-medium border-r border-[#E5E7EB]">
                        {f.rule_no || "—"}
                      </td>
                      <td className="px-4 py-3 text-[#1A1A2E] border-r border-[#E5E7EB]">
                        <span className={f.url ? "text-[#4A6FA5] hover:underline" : ""}>{f.rule_heading}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-[#6B7280] border-r border-[#E5E7EB]">
                        {f.form_no || "—"}
                      </td>
                      <td className="px-4 py-3 text-center text-[#6B7280] border-r border-[#E5E7EB]">
                        {f.page_no || "—"}
                      </td>
                      <td className="px-4 py-3 text-center text-[#6B7280]">
                        {f.parallel_rule_1962 || "—"}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => openEdit(f)}
                              className="text-[#4A6FA5] hover:text-[#1E3A5F] text-xs font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteForm(f.id)}
                              disabled={deletingFormId === f.id}
                              className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-40"
                            >
                              {deletingFormId === f.id ? "Deleting…" : "Delete"}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TEMPLATES TAB ── */}
      {activeTab === "templates" && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm overflow-hidden">
          {templates.length === 0 ? (
            <div className="px-6 py-16 text-center text-[#6B7280] text-sm">
              No templates yet.{isAdmin && " Click \"Add Template\" to upload one."}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8F9FA] border-b border-[#E5E7EB]">
                  <th className="text-left px-6 py-3 font-medium text-[#6B7280]">Template Name</th>
                  <th className="text-left px-4 py-3 font-medium text-[#6B7280]">Description</th>
                  <th className="text-left px-4 py-3 font-medium text-[#6B7280]">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-[#6B7280]">Size</th>
                  <th className="text-left px-4 py-3 font-medium text-[#6B7280]">Download</th>
                  {isAdmin && <th className="px-4 py-3 font-medium text-[#6B7280] w-28"></th>}
                </tr>
              </thead>
              <tbody>
                {templates.map((t, i) => {
                  const icon = fileIcon(t.file_type ? t.file_type.toLowerCase() : t.name);
                  return (
                    <tr
                      key={t.id}
                      className={`border-b border-[#E5E7EB] ${i % 2 === 0 ? "bg-white" : "bg-[#F8F9FA]"} hover:bg-[#EEF2FF] transition-colors cursor-pointer`}
                      onClick={() => window.open(t.file_url, "_blank")}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg ${icon.bg} flex items-center justify-center flex-shrink-0`}>
                            <span className={`text-xs font-bold ${icon.text}`}>{icon.label}</span>
                          </div>
                          <span className="font-medium text-[#1A1A2E]">{t.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-[#6B7280]">{t.description ?? "—"}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${icon.bg} ${icon.text}`}>
                          {t.file_type ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-[#6B7280]">{formatSize(t.file_size ?? 0)}</td>
                      <td className="px-4 py-4">
                        <a
                          href={t.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 text-[#4A6FA5] hover:text-[#1E3A5F] text-xs font-medium"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download
                        </a>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => openEditTemplate(t)}
                              className="text-[#4A6FA5] hover:text-[#1E3A5F] text-xs font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(t.id)}
                              disabled={deletingId === t.id}
                              className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-40"
                            >
                              {deletingId === t.id ? "Deleting…" : "Delete"}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── EDIT TEMPLATE MODAL ── */}
      {showEditTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[#1A1A2E]">Edit Template</h2>
              <button onClick={() => setShowEditTemplateModal(false)} className="text-[#6B7280] hover:text-[#1A1A2E]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleEditTemplateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A2E] mb-1">Template Name *</label>
                <input
                  value={editTemplateName}
                  onChange={(e) => setEditTemplateName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A2E] mb-1">Description</label>
                <textarea
                  value={editTemplateDesc}
                  onChange={(e) => setEditTemplateDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B7280] mb-1">File</label>
                <p className="text-xs text-[#6B7280] bg-[#F8F9FA] rounded-lg px-3 py-2 truncate">
                  {editingTemplate?.file_url}
                </p>
                <p className="text-xs text-[#6B7280] mt-1">To replace the file, delete this template and add a new one.</p>
              </div>
              {editTemplateError && <p className="text-sm text-red-600">{editTemplateError}</p>}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={editTemplateLoading} className="flex-1 py-2.5 bg-[#1E3A5F] hover:bg-[#162d4a] disabled:opacity-60 text-white text-sm font-medium rounded-lg transition">
                  {editTemplateLoading ? "Saving…" : "Save Changes"}
                </button>
                <button type="button" onClick={() => setShowEditTemplateModal(false)} className="flex-1 py-2.5 border border-[#E5E7EB] text-[#1A1A2E] text-sm font-medium rounded-lg hover:bg-[#F8F9FA] transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD TEMPLATE MODAL ── */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[#1A1A2E]">Add Template</h2>
              <button onClick={() => setShowTemplateModal(false)} className="text-[#6B7280] hover:text-[#1A1A2E]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleTemplateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A2E] mb-1">Template Name *</label>
                <input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  required
                  placeholder="e.g. Adjournment Letter"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#1A1A2E] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A2E] mb-1">Description</label>
                <textarea
                  value={templateDesc}
                  onChange={(e) => setTemplateDesc(e.target.value)}
                  rows={2}
                  placeholder="Brief description of this template…"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#1A1A2E] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A2E] mb-1">File *</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setTemplateFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-[#6B7280] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#1E3A5F] file:text-white hover:file:bg-[#162d4a] file:cursor-pointer cursor-pointer"
                />
              </div>
              {templateError && <p className="text-sm text-red-600">{templateError}</p>}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={templateLoading} className="flex-1 py-2.5 bg-[#1E3A5F] hover:bg-[#162d4a] disabled:opacity-60 text-white text-sm font-medium rounded-lg transition">
                  {templateLoading ? "Uploading…" : "Upload Template"}
                </button>
                <button type="button" onClick={() => setShowTemplateModal(false)} className="flex-1 py-2.5 border border-[#E5E7EB] text-[#1A1A2E] text-sm font-medium rounded-lg hover:bg-[#F8F9FA] transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD / EDIT FORM MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[#1A1A2E]">
                {editingForm ? "Edit Row" : "Add New Row"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-[#6B7280] hover:text-[#1A1A2E]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1A1A2E] mb-1">Rule No.</label>
                  <input
                    name="rule_no"
                    value={formData.rule_no}
                    onChange={handleChange}
                    placeholder="e.g. 1."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#1A1A2E] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A1A2E] mb-1">Form No.</label>
                  <input
                    name="form_no"
                    value={formData.form_no}
                    onChange={handleChange}
                    placeholder="e.g. 2 & 3"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#1A1A2E] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A2E] mb-1">Rule Heading *</label>
                <textarea
                  name="rule_heading"
                  value={formData.rule_heading}
                  onChange={handleChange}
                  required
                  rows={2}
                  placeholder="e.g. Short title and commencement"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#1A1A2E] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1A1A2E] mb-1">Page No.</label>
                  <input
                    name="page_no"
                    value={formData.page_no}
                    onChange={handleChange}
                    placeholder="e.g. 1"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#1A1A2E] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A1A2E] mb-1">Parallel Rule (1962)</label>
                  <input
                    name="parallel_rule_1962"
                    value={formData.parallel_rule_1962}
                    onChange={handleChange}
                    placeholder="e.g. 6DDA"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#1A1A2E] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A2E] mb-1">
                  URL <span className="text-[#6B7280] font-normal">(optional — makes row clickable)</span>
                </label>
                <input
                  name="url"
                  value={formData.url}
                  onChange={handleChange}
                  placeholder="https://..."
                  type="url"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#1A1A2E] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-[#1E3A5F] hover:bg-[#162d4a] disabled:opacity-60 text-white text-sm font-medium rounded-lg transition"
                >
                  {loading ? "Saving…" : editingForm ? "Save Changes" : "Add Row"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-[#E5E7EB] text-[#1A1A2E] text-sm font-medium rounded-lg hover:bg-[#F8F9FA] transition"
                >
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
