"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/app/context/UserContext";
import Sidebar from "@/app/components/Sidebar";
import Navbar from "@/app/components/Navbar";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { ChevronLeft, Send, CheckCircle2, Copy, Mail, Pencil, MailOpen, Eye, XCircle, FileSignature } from "lucide-react";
import { formatMoney } from "@/lib/pricing";
import PdfViewer from "@/app/components/PdfViewer";

interface Proposal {
  _id: string;
  proposalNumber?: string;
  clientName: string;
  companyName?: string;
  clientPhone?: string;
  clientEmail: string;
  projectName?: string;
  totalPrice?: number;
  discount?: number;
  currency: string;
  pdfFile?: string;
  pdfName?: string;
  status: "draft" | "sent" | "viewed" | "signed" | "rejected";
  refundPolicy?: string;
  token: string;
  sentAt?: string;
  openedAt?: string;
  viewedAt?: string;
  signedAt?: string;
  signerName?: string;
  signerIp?: string;
  signatureImage?: string;
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-zinc-100 text-zinc-600 border-zinc-200",
  sent: "bg-blue-50 text-blue-700 border-blue-100",
  viewed: "bg-amber-50 text-amber-700 border-amber-100",
  signed: "bg-emerald-50 text-emerald-700 border-emerald-100",
  rejected: "bg-red-50 text-red-700 border-red-100",
};

export default function ProposalDetailPage() {
  const { user } = useUser();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const justSent = searchParams?.get("sent") === "true";

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const fetchProposal = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/proposals/${id}`);
      if (res.ok) setProposal(await res.json());
      else setError("Proposal not found.");
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProposal(); }, [id]);
  useEffect(() => { if (justSent && proposal) setMessage(`Proposal sent to ${proposal.clientEmail}.`); }, [justSent, proposal]);

  const signUrl = typeof window !== "undefined" && proposal ? `${window.location.origin}/proposals/sign/${proposal.token}` : "";

  const handleSend = async () => {
    setSending(true); setError(""); setMessage("");
    try {
      const res = await fetch(`/api/proposals/${id}/send`, {
        method: "POST", headers: { "x-user-role": user?.role || "", "x-user-email": user?.email || "", "x-user-name": user?.name || "" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send.");
      setMessage(`Proposal emailed to ${proposal?.clientEmail}.`);
      fetchProposal();
    } catch (err: any) { setError(err.message); }
    finally { setSending(false); }
  };

  const copyLink = () => { navigator.clipboard.writeText(signUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  if (loading) return <Shell><p className="text-zinc-400 text-sm">Loading...</p></Shell>;
  if (!proposal) return <Shell><p className="text-zinc-500 text-sm">{error || "Not found."}</p></Shell>;

  const p = proposal;
  const isSigned = p.status === "signed";

  const timeline = [
    { label: "Sent", at: p.sentAt, icon: Send },
    { label: "Email opened", at: p.openedAt, icon: MailOpen },
    { label: "Proposal viewed", at: p.viewedAt, icon: Eye },
    { label: p.status === "rejected" ? "Rejected" : "Signed", at: p.signedAt, icon: p.status === "rejected" ? XCircle : CheckCircle2 },
  ];

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar />
      <div className="flex-grow pl-64 flex flex-col">
        <Navbar />
        <main className="flex-grow pt-20 px-8 pb-8">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => router.push("/dashboard/proposals")}
              className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 font-medium transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back to Proposals
            </button>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-1 font-bold px-3 py-1 rounded-full border capitalize text-xs ${STATUS_STYLES[p.status]}`}>
                {isSigned && <CheckCircle2 className="w-3.5 h-3.5" />}{p.status}
              </span>
              {user?.role === "admin" && !isSigned && (
                <button onClick={() => router.push(`/dashboard/proposals/${id}/edit`)}
                  className="flex items-center gap-1.5 px-3 py-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-lg text-xs font-semibold transition-colors">
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
            {/* PDF */}
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-5">
              <PdfViewer data={p.pdfFile} />
            </div>

            {/* Side panel */}
            <div className="space-y-6">
              <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 space-y-3">
                <h2 className="text-sm font-bold text-zinc-900">{p.projectName || "Proposal"}</h2>
                {p.proposalNumber && <p className="text-[11px] font-mono text-zinc-400">{p.proposalNumber}</p>}
                <div className="space-y-1.5 text-sm pt-1">
                  <KV k="Client" v={p.clientName} />
                  {p.companyName && <KV k="Company" v={p.companyName} />}
                  {p.clientPhone && <KV k="Phone" v={p.clientPhone} />}
                  <KV k="Email" v={p.clientEmail} />
                  {p.discount ? (
                    <>
                      <KV k="Subtotal" v={formatMoney(p.totalPrice || 0, p.currency)} />
                      <KV k="Discount" v={`-${formatMoney(p.discount, p.currency)}`} />
                    </>
                  ) : null}
                  <div className="flex justify-between pt-1.5 border-t border-zinc-100 font-bold text-zinc-900">
                    <span>Total</span><span>{formatMoney((p.totalPrice || 0) - (p.discount || 0), p.currency)}</span>
                  </div>
                </div>
              </div>

              {p.refundPolicy && (
                <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 space-y-2">
                  <h2 className="text-sm font-bold text-zinc-900">Refund Policy</h2>
                  <p className="text-xs text-zinc-600 bg-zinc-50 border border-zinc-100 rounded-lg p-3 whitespace-pre-wrap leading-relaxed">
                    {p.refundPolicy}
                  </p>
                </div>
              )}

              <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 space-y-4">
                <h2 className="text-sm font-bold text-zinc-900">Send to Client</h2>
                {message && <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-medium">{message}</div>}
                {error && <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-medium">{error}</div>}

                {isSigned ? (
                  <p className="text-xs text-zinc-500">This proposal has been signed and can no longer be sent.</p>
                ) : (
                  user?.role === "admin" && (
                    <button onClick={handleSend} disabled={sending}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50">
                      {sending ? "Sending..." : <><Send className="w-4 h-4" /> {p.sentAt ? "Resend Email" : "Send Proposal"}</>}
                    </button>
                  )
                )}

                <div className="pt-3 border-t border-zinc-100">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Signing link</p>
                  <div className="flex items-center gap-2">
                    <input readOnly value={signUrl} className="flex-1 px-2.5 py-1.5 border border-zinc-200 rounded-lg text-[11px] text-zinc-600 bg-zinc-50 truncate" />
                    <button onClick={copyLink} className="p-2 border border-zinc-200 hover:bg-zinc-100 rounded-lg text-zinc-600 transition-colors" title="Copy link"><Copy className="w-3.5 h-3.5" /></button>
                  </div>
                  {copied && <p className="text-[10px] text-emerald-600 mt-1 font-semibold">Copied!</p>}
                </div>
              </div>

              <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6">
                <h2 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-1.5"><FileSignature className="w-4 h-4" /> Activity</h2>
                <div className="space-y-3">
                  {timeline.map((t) => {
                    const Icon = t.icon; const done = !!t.at;
                    return (
                      <div key={t.label} className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${done ? "bg-emerald-50 text-emerald-600" : "bg-zinc-100 text-zinc-300"}`}><Icon className="w-3.5 h-3.5" /></div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold ${done ? "text-zinc-900" : "text-zinc-400"}`}>{t.label}</p>
                          {done && <p className="text-[10px] text-zinc-400">{new Date(t.at!).toLocaleString("en-GB")}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {isSigned && p.signatureImage && (
                  <div className="mt-4 pt-4 border-t border-zinc-100">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Signature {p.signerIp && `· IP ${p.signerIp}`}</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.signatureImage} alt="Signature" className="h-14 bg-white border border-zinc-100 rounded p-1" />
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                <p className="text-xs text-blue-800 flex items-start gap-2 leading-relaxed">
                  <Mail className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  Client can view the PDF online (no download). After they sign, the signed PDF is emailed to them and {formatMoney(p.totalPrice || 0, p.currency)} is added as income.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar />
      <div className="flex-grow pl-64 flex flex-col">
        <Navbar />
        <main className="flex-grow pt-20 px-8 pb-8">{children}</main>
      </div>
    </div>
  );
}
function KV({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-3"><span className="text-zinc-500">{k}</span><span className="text-zinc-800 font-medium text-right">{v}</span></div>;
}
