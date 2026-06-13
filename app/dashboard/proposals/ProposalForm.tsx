"use client";

import React, { useState } from "react";
import { useUser } from "@/app/context/UserContext";
import { useRouter } from "next/navigation";
import { Save, Send, FileText, Upload, User, Mail, Phone, Building2, DollarSign, ExternalLink, X, Lock } from "lucide-react";
import PdfViewer from "@/app/components/PdfViewer";

export interface ProposalData {
  _id?: string;
  clientName?: string;
  companyName?: string;
  clientPhone?: string;
  clientEmail?: string;
  projectName?: string;
  totalPrice?: number;
  discount?: number;
  currency?: "BDT" | "USD";
  pdfFile?: string;
  pdfName?: string;
  refundPolicy?: string;
}

const CANVA_COVER_URL =
  "https://www.canva.com/design/DAHMdZ8muCc/yDpfAhuL0wqMGqNL66X5Kw/edit?locale=en&ui=eyJBIjp7IkUiOnsiQSI6dHJ1ZX19fQ";

const field =
  "w-full pl-10 pr-4 py-2.5 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm bg-white";

export default function ProposalForm({ initial }: { initial?: ProposalData }) {
  const { user } = useUser();
  const router = useRouter();

  const [form, setForm] = useState<ProposalData>({ currency: "USD", ...initial });
  const [id, setId] = useState<string | undefined>(initial?._id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof ProposalData, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const headers = {
    "Content-Type": "application/json",
    "x-user-role": user?.role || "",
    "x-user-email": user?.email || "",
    "x-user-name": user?.name || "",
  };

  const handlePdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf") { alert("Please upload a PDF file."); return; }
    if (file.size > 8 * 1024 * 1024) { alert("PDF must be under 8MB."); return; }
    const data = await new Promise<string>((resolve) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.readAsDataURL(file);
    });
    setForm((f) => ({ ...f, pdfFile: data, pdfName: file.name }));
  };

  const save = async (autoSend: boolean) => {
    setError("");
    if (!form.clientName?.trim() || !form.clientEmail?.trim()) { setError("Client name and email are required."); return; }
    if (!form.pdfFile) { setError("Please upload the proposal PDF."); return; }
    setSaving(true);
    try {
      const res = await fetch(id ? `/api/proposals/${id}` : "/api/proposals", {
        method: id ? "PUT" : "POST", headers, body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save.");
      const savedId = data._id || id;

      if (autoSend) {
        const sres = await fetch(`/api/proposals/${savedId}/send`, { method: "POST", headers });
        const sdata = await sres.json();
        if (!sres.ok) throw new Error(sdata.error || "Saved, but failed to email client.");
        router.push(`/dashboard/proposals/${savedId}?sent=true`);
        return;
      }
      router.push(`/dashboard/proposals/${savedId}`);
    } catch (err: any) { setError(err.message); setSaving(false); }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_480px] gap-6 items-start">
    <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden w-full">
      <div className="px-8 py-5 border-b border-zinc-100">
        <h1 className="text-lg font-bold text-zinc-900">Proposal Details</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Upload the proposal PDF and enter the client &amp; price. Then send it for signing.</p>
      </div>

      <div className="px-8 py-6 space-y-6">
        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">{error}</div>}

        {/* PDF upload */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-zinc-700">Proposal PDF <span className="text-red-500">*</span></label>
          {form.pdfFile ? (
            <div className="flex items-center justify-between bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3">
              <span className="flex items-center gap-2 text-sm text-zinc-700 truncate">
                <FileText className="w-4 h-4 text-red-600" /> {form.pdfName || "proposal.pdf"}
              </span>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer text-xs font-semibold px-3 py-1.5 border border-zinc-200 rounded-lg hover:bg-white text-zinc-700">
                  Replace
                  <input type="file" accept="application/pdf" className="hidden" onChange={handlePdf} />
                </label>
                <button type="button" onClick={() => setForm((f) => ({ ...f, pdfFile: undefined, pdfName: undefined }))}
                  className="p-1.5 text-zinc-400 hover:text-red-600 rounded"><X className="w-4 h-4" /></button>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-zinc-300 rounded-xl cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/30 transition-all text-sm text-zinc-500">
              <Upload className="w-6 h-6 text-zinc-400" />
              <span>Click to upload your proposal PDF (max 8MB)</span>
              <input type="file" accept="application/pdf" className="hidden" onChange={handlePdf} />
            </label>
          )}
          <a href={CANVA_COVER_URL} target="_blank" rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-3 py-1.5 rounded-lg transition-colors">
            <ExternalLink className="w-3.5 h-3.5" /> Design the proposal in Canva
          </a>
        </div>

        {/* Client info */}
        <div className="grid grid-cols-2 gap-5">
          <Field label="Client Name" required icon={<User className="w-4 h-4" />}>
            <input className={field} value={form.clientName || ""} onChange={(e) => set("clientName", e.target.value)} placeholder="John Doe" />
          </Field>
          <Field label="Company Name" icon={<Building2 className="w-4 h-4" />}>
            <input className={field} value={form.companyName || ""} onChange={(e) => set("companyName", e.target.value)} placeholder="Acme Inc." />
          </Field>
          <Field label="Phone Number" icon={<Phone className="w-4 h-4" />}>
            <input className={field} value={form.clientPhone || ""} onChange={(e) => set("clientPhone", e.target.value)} placeholder="+8801..." />
          </Field>
          <Field label="Email" required icon={<Mail className="w-4 h-4" />}>
            <input type="email" className={field} value={form.clientEmail || ""} onChange={(e) => set("clientEmail", e.target.value)} placeholder="client@example.com" />
          </Field>
        </div>

        {/* Project + price */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="md:col-span-2">
            <Field label="Project Name" icon={<FileText className="w-4 h-4" />}>
              <input className={field} value={form.projectName || ""} onChange={(e) => set("projectName", e.target.value)} placeholder="Website Development" />
            </Field>
          </div>
          <div>
            <Field label="Total Price" icon={<DollarSign className="w-4 h-4" />}>
              <input type="number" className={field} value={form.totalPrice ?? ""} onChange={(e) => set("totalPrice", Number(e.target.value))} placeholder="1200" />
            </Field>
          </div>
          <div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700">Currency</label>
              <select className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                value={form.currency} onChange={(e) => set("currency", e.target.value)}>
                <option value="USD">USD ($)</option>
                <option value="BDT">BDT (Tk)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Discount + Refund Policy */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div>
            <Field label="Discount" icon={<DollarSign className="w-4 h-4" />}>
              <input type="number" className={field} value={form.discount ?? ""} onChange={(e) => set("discount", Number(e.target.value) || 0)} placeholder="200" />
            </Field>
          </div>
          <div className="md:col-span-3">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700">Refund Policy</label>
              <textarea 
                className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm bg-white"
                value={form.refundPolicy || ""} 
                onChange={(e) => set("refundPolicy", e.target.value)} 
                placeholder="Enter refund policy/terms here (e.g. 'No refunds after work commences.')"
                rows={2}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-4 border-t border-zinc-100 flex items-center justify-end gap-3">
        <button onClick={() => save(false)} disabled={saving}
          className="flex items-center gap-1.5 px-5 py-2.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-lg text-sm font-semibold disabled:opacity-50">
          <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save"}
        </button>
        <button onClick={() => save(true)} disabled={saving}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
          <Send className="w-4 h-4" /> {saving ? "Sending…" : "Save & Send to Client"}
        </button>
      </div>
    </div>

    {/* Live PDF preview — auto-shows after upload */}
    <div className="xl:sticky xl:top-24">
      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <FileText className="w-3.5 h-3.5" /> PDF Preview
      </p>
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-4 max-h-[calc(100vh-9rem)] overflow-y-auto">
        {form.pdfFile ? (
          <>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-semibold mb-3"><Lock className="w-3.5 h-3.5" /> View only</div>
            <PdfViewer data={form.pdfFile} />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
            <FileText className="w-9 h-9 mb-2" />
            <p className="text-sm">Upload a PDF to preview it here.</p>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

function Field({ label, required, icon, children }: { label: string; required?: boolean; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-zinc-700">{label} {required && <span className="text-red-500">*</span>}</label>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">{icon}</span>
        {children}
      </div>
    </div>
  );
}
