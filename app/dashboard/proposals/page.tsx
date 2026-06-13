"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/app/context/UserContext";
import Sidebar from "@/app/components/Sidebar";
import Navbar from "@/app/components/Navbar";
import { useRouter } from "next/navigation";
import { Plus, FileSignature, Trash2, Eye, CheckCircle2, Send, FileText, XCircle, MailOpen, X, ExternalLink, Lock, Pencil } from "lucide-react";
import Swal from "sweetalert2";
import PdfViewer from "@/app/components/PdfViewer";

interface Proposal {
  _id: string;
  proposalNumber?: string;
  clientName: string;
  clientEmail: string;
  projectName?: string;
  totalPrice?: number;
  currency: string;
  status: "draft" | "sent" | "viewed" | "signed" | "rejected";
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-zinc-100 text-zinc-600 border-zinc-200",
  sent: "bg-blue-50 text-blue-700 border-blue-100",
  viewed: "bg-amber-50 text-amber-700 border-amber-100",
  signed: "bg-emerald-50 text-emerald-700 border-emerald-100",
  rejected: "bg-red-50 text-red-700 border-red-100",
};

function money(amount: number | undefined, currency: string) {
  const symbol = currency === "USD" ? "$" : "Tk ";
  return `${symbol}${Number(amount || 0).toLocaleString()}`;
}

function StatusIcon({ status }: { status: string }) {
  if (status === "signed") return <CheckCircle2 className="w-3 h-3" />;
  if (status === "sent") return <Send className="w-3 h-3" />;
  if (status === "viewed") return <MailOpen className="w-3 h-3" />;
  if (status === "rejected") return <XCircle className="w-3 h-3" />;
  return null;
}

export default function ProposalsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<any | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const openPreview = async (id: string) => {
    setPreview({ _id: id });
    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/proposals/${id}`);
      if (res.ok) setPreview(await res.json());
    } catch (e) { console.error(e); }
    finally { setPreviewLoading(false); }
  };

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/proposals");
      if (res.ok) setProposals(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProposals(); }, []);

  const handleDelete = async (id: string) => {
    const resConfirm = await Swal.fire({
      title: "Delete proposal?",
      text: "Are you sure you want to delete this proposal?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#71717a",
      confirmButtonText: "Yes, delete it",
    });
    if (!resConfirm.isConfirmed) return;
    try {
      const res = await fetch(`/api/proposals/${id}`, {
        method: "DELETE",
        headers: { "x-user-role": user?.role || "", "x-user-email": user?.email || "", "x-user-name": user?.name || "" },
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Delete failed"); }
      fetchProposals();
      Swal.fire({
        title: "Deleted!",
        text: "The proposal has been deleted.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire("Error!", err.message, "error");
    }
  };

  const handleQuickSend = async (id: string, clientEmail: string, title?: string) => {
    setSendingId(id);
    try {
      const res = await fetch(`/api/proposals/${id}/send`, {
        method: "POST",
        headers: { "x-user-role": user?.role || "", "x-user-email": user?.email || "", "x-user-name": user?.name || "" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send.");
      Swal.fire({
        title: "Success!",
        text: `Proposal "${title || "Untitled"}" successfully emailed to ${clientEmail}`,
        icon: "success",
        confirmButtonColor: "#10b981",
      });
      fetchProposals();
    } catch (err: any) {
      Swal.fire("Error!", err.message, "error");
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar />
      <div className="flex-grow pl-64 flex flex-col">
        <Navbar />
        <main className="flex-grow pt-20 px-8 pb-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-xs text-zinc-500 font-medium">
              Send detailed proposals to clients — once signed, income is auto-recorded in the ledger.
            </p>
            {user?.role === "admin" && (
              <button onClick={() => router.push("/dashboard/proposals/new")}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm">
                <Plus className="w-4 h-4" /> New Proposal
              </button>
            )}
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 font-semibold text-zinc-500 uppercase">
                    <th className="pb-3 pl-2">Proposal</th>
                    <th className="pb-3">Client</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3">Created</th>
                    <th className="pb-3 text-right pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {loading ? (
                    <tr><td colSpan={6} className="py-8 text-center text-zinc-400">Loading proposals...</td></tr>
                  ) : proposals.length === 0 ? (
                    <tr><td colSpan={6} className="py-12 text-center text-zinc-400">
                      <FileSignature className="w-8 h-8 mx-auto mb-2 text-zinc-300" /> No proposals yet.
                    </td></tr>
                  ) : (
                    proposals.map((p) => (
                      <tr key={p._id} className="hover:bg-zinc-50 transition-colors">
                        <td className="py-3.5 pl-2">
                          <div className="font-bold text-zinc-900 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-zinc-400" />
                            {p.projectName || "Untitled"}
                          </div>
                          {p.proposalNumber && <div className="text-[10px] text-zinc-400 font-mono ml-5">{p.proposalNumber}</div>}
                        </td>
                        <td className="py-3.5">
                          <div className="text-zinc-900 font-medium">{p.clientName}</div>
                          <div className="text-[10px] text-zinc-400">{p.clientEmail}</div>
                        </td>
                        <td className="py-3.5 text-right font-bold text-zinc-900">{money(p.totalPrice, p.currency)}</td>
                        <td className="py-3.5 text-center">
                          <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLES[p.status]}`}>
                            <StatusIcon status={p.status} />{p.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-zinc-500">
                          {new Date(p.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="py-3.5 text-right pr-2">
                          <div className="inline-flex gap-2">
                            <button onClick={() => openPreview(p._id)}
                              className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors" title="Preview PDF">
                              <Eye className="w-4 h-4" />
                            </button>
                            {user?.role === "admin" && p.status !== "signed" && (
                              <button onClick={() => router.push(`/dashboard/proposals/${p._id}/edit`)}
                                className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors" title="Edit">
                                <Pencil className="w-4 h-4" />
                              </button>
                            )}
                            {user?.role === "admin" && p.status !== "signed" && (
                              <button 
                                onClick={() => handleQuickSend(p._id, p.clientEmail, p.projectName)}
                                disabled={sendingId === p._id}
                                className="p-1.5 text-zinc-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors disabled:opacity-50" 
                                title="Send Email"
                              >
                                {sendingId === p._id ? (
                                  <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4" />
                                )}
                              </button>
                            )}
                            {user?.role === "admin" && (
                              <button onClick={() => handleDelete(p._id)}
                                className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Side PDF preview drawer */}
      {preview && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setPreview(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
          <div className="relative w-full max-w-2xl bg-zinc-50 h-full shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-white">
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-zinc-900 truncate">{preview.projectName || "Proposal"}</h2>
                <p className="text-[11px] text-zinc-500 truncate">
                  {preview.clientName}{preview.totalPrice ? ` · ${money(preview.totalPrice, preview.currency)}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {user?.role === "admin" && !previewLoading && preview.status !== "signed" && (
                  <button onClick={() => router.push(`/dashboard/proposals/${preview._id}/edit`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-lg text-xs font-semibold transition-colors">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                )}
                <button onClick={() => router.push(`/dashboard/proposals/${preview._id}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-lg text-xs font-semibold">
                  <ExternalLink className="w-3.5 h-3.5" /> Open full
                </button>
                <button onClick={() => setPreview(null)} className="p-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg"><X className="w-4 h-4" /></button>
              </div>
            </div>
            {/* PDF */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-semibold mb-3">
                <Lock className="w-3.5 h-3.5" /> View only
              </div>
              {previewLoading || !preview.pdfFile ? (
                <div className="flex items-center justify-center py-20 text-zinc-400 text-sm">
                  {previewLoading ? "Loading PDF…" : "No PDF uploaded."}
                </div>
              ) : (
                <PdfViewer data={preview.pdfFile} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
