"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Building, CheckCircle2, FileSignature, Loader2, XCircle, Eraser, Lock, Pencil, Upload, Type as TypeIcon, ChevronRight, FileText, X } from "lucide-react";
import PdfViewer from "@/app/components/PdfViewer";
import Confetti from "@/app/components/Confetti";

const generateTypedSignature = (name: string): string => {
  const canvas = document.createElement("canvas");
  canvas.width = 420;
  canvas.height = 150;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // handwriting styled text
    ctx.font = "italic 36px 'Brush Script MT', 'cursive', 'Georgia', 'serif'";
    ctx.fillStyle = "#18181b";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name, canvas.width / 2, canvas.height / 2);
    
    // underline
    ctx.strokeStyle = "#d4d4d8";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(30, 110);
    ctx.lineTo(390, 110);
    ctx.stroke();
  }
  return canvas.toDataURL("image/png");
};

interface Proposal {
  proposalNumber?: string;
  clientName: string;
  companyName?: string;
  projectName?: string;
  totalPrice?: number;
  discount?: number;
  currency: string;
  pdfFile?: string;
  status: "draft" | "sent" | "viewed" | "signed" | "rejected";
  signerName?: string;
  refundPolicy?: string;
}

function money(amount: number | undefined, currency: string) {
  const symbol = currency === "USD" ? "$" : "Tk ";
  return `${symbol}${Number(amount || 0).toLocaleString()}`;
}

export default function SignProposalPage() {
  const params = useParams();
  const token = params.token as string;

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<"signed" | "rejected" | "">("");

  const [sigMode, setSigMode] = useState<"draw" | "type" | "upload">("draw");
  const [uploadedSig, setUploadedSig] = useState<string>("");
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasDrawn = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/proposals/sign/${token}`);
        if (!res.ok) { setNotFound(true); return; }
        const data = await res.json();
        setProposal(data);
        if (data.status === "signed") setResult("signed");
        if (data.status === "rejected") setResult("rejected");
      } catch { setNotFound(true); }
      finally { setLoading(false); }
    })();
  }, [token]);

  const pos = (e: React.PointerEvent) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) };
  };
  const startDraw = (e: React.PointerEvent) => { drawing.current = true; const ctx = canvasRef.current!.getContext("2d")!; const { x, y } = pos(e); ctx.beginPath(); ctx.moveTo(x, y); };
  const draw = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.strokeStyle = "#18181b";
    const { x, y } = pos(e); ctx.lineTo(x, y); ctx.stroke(); hasDrawn.current = true;
  };
  const endDraw = () => { drawing.current = false; };
  const clearPad = () => { const c = canvasRef.current!; c.getContext("2d")!.clearRect(0, 0, c.width, c.height); hasDrawn.current = false; };

  const handleSigUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please upload an image (PNG/JPG)."); return; }
    if (file.size > 2 * 1024 * 1024) { setError("Signature image must be under 2MB."); return; }
    const data = await new Promise<string>((resolve) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.readAsDataURL(file);
    });
    setUploadedSig(data);
    setError("");
  };

  const submit = async (action: "sign" | "reject") => {
    setError("");
    let signatureImage: string | undefined;
    if (action === "sign") {
      if (!signerName.trim()) { setError("Please type your full name to sign."); return; }
      if (!agreed) { setError("Please confirm you agree to the proposal terms."); return; }
      if (sigMode === "draw") {
        if (!hasDrawn.current) { setError("Please draw your signature."); return; }
        signatureImage = canvasRef.current?.toDataURL("image/png");
      } else if (sigMode === "type") {
        signatureImage = generateTypedSignature(signerName.trim());
      } else {
        if (!uploadedSig) { setError("Please upload your signature image."); return; }
        signatureImage = uploadedSig;
      }
    } else if (!confirm("Reject this proposal?")) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/proposals/sign/${token}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, signerName: signerName.trim(), signatureImage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setResult(data.status);
    } catch (err: any) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-zinc-50"><Loader2 className="w-8 h-8 text-zinc-400 animate-spin" /></div>;

  if (notFound || !proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-6">
        <div className="text-center">
          <FileSignature className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <h1 className="text-lg font-bold text-zinc-900">Proposal not found</h1>
          <p className="text-sm text-zinc-500 mt-1">This signing link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  const nameForDisplay = proposal.signerName || signerName;

  if (result === "signed") {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-zinc-50/50 px-6 py-12 overflow-hidden">
        {/* Confetti Celebration */}
        <Confetti />

        {/* Ambient Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-teal-500/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Card */}
        <div className="relative max-w-md w-full bg-white/90 backdrop-blur-md border border-zinc-200/80 rounded-2xl shadow-[0_20px_50px_rgba(16,185,129,0.06)] px-8 py-10 text-center space-y-8 transition-all duration-300 hover:shadow-[0_25px_60px_rgba(16,185,129,0.09)]">
          {/* Animated Success Badge */}
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400/20 animate-ping opacity-75" />
            <div className="relative w-16 h-16 rounded-full bg-linear-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <CheckCircle2 className="w-8 h-8 text-white stroke-[2.5]" />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Proposal Signed!</h2>
            <p className="text-sm text-zinc-500 max-w-sm mx-auto leading-relaxed">
              Thank you{nameForDisplay ? `, ${nameForDisplay}` : ""}! The signed proposal has been successfully submitted, and a finalized PDF copy has been sent to your email.
            </p>
          </div>

          {/* Receipt Style Details Box */}
          <div className="border border-zinc-200/80 rounded-xl p-5 bg-zinc-50/50 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200/60 pb-3">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Signed Details</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-850 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Signed
              </span>
            </div>

            <div className="text-xs space-y-2.5 text-zinc-700">
              <div className="flex justify-between items-baseline">
                <span className="font-medium text-zinc-500">Project:</span>
                <span className="font-bold text-zinc-900 truncate max-w-[180px]">{proposal.projectName || "Proposal"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-zinc-500">Subtotal:</span>
                <span className="font-semibold text-zinc-900">{money(proposal.totalPrice, proposal.currency)}</span>
              </div>
              {proposal.discount ? (
                <div className="flex justify-between items-center text-red-500 font-medium">
                  <span>Discount:</span>
                  <span className="font-semibold">-{money(proposal.discount, proposal.currency)}</span>
                </div>
              ) : null}
              <div className="flex justify-between items-center pt-3 border-t border-dashed border-zinc-200/80 font-bold text-zinc-900 text-sm">
                <span>Total Amount:</span>
                <span className="text-emerald-600 text-base">{money((proposal.totalPrice || 0) - (proposal.discount || 0), proposal.currency)}</span>
              </div>
            </div>

            {proposal.refundPolicy && (
              <div className="pt-3 border-t border-zinc-200/60">
                <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Policy / Terms:</span>
                <p className="text-[11px] text-zinc-650 bg-white border border-zinc-150 rounded-lg p-2.5 max-h-[90px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {proposal.refundPolicy}
                </p>
              </div>
            )}
          </div>

          <p className="text-xs text-zinc-450 tracking-wider">Powered by TEACHFOSYS · Fund Trac</p>
        </div>
      </div>
    );
  }

  if (result === "rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-6">
        <div className="max-w-md w-full bg-white border border-zinc-200 rounded-lg shadow-xl px-8 py-12 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-zinc-950">Proposal Rejected</h2>
            <p className="text-sm text-zinc-500">
              You have rejected this proposal. The sender has been notified.
            </p>
          </div>
          <p className="text-xs text-zinc-400">Powered by TEACHFOSYS · Fund Trac</p>
        </div>
      </div>
    );
  }

  const p = proposal;
  const tab = "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-colors";

  return (
    <div className="min-h-screen bg-zinc-50 py-10 px-6">
      <div className="w-full mx-auto">
        {/* Brand + summary */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-zinc-900 text-white rounded-lg flex items-center justify-center shadow-md"><Building className="w-5 h-5" /></div>
            <div>
              <span className="font-bold text-lg text-zinc-900">TEACHFOSYS</span>
              <span className="block text-[10px] text-zinc-400 font-semibold tracking-wider uppercase">Project Proposal</span>
            </div>
          </div>
          {p.proposalNumber && <span className="text-xs text-zinc-400 font-mono">{p.proposalNumber}</span>}
        </div>

        {/* 2-grid: PDF | sign panel */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-6 items-start">
          {/* PDF */}
          <div className="bg-white border border-zinc-200 rounded-lg p-5">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-semibold mb-3">
              <Lock className="w-3.5 h-3.5" /> View only — download disabled
            </div>
            <PdfViewer data={p.pdfFile} />
          </div>

          {/* Sign panel */}
          <div className="lg:sticky lg:top-6 space-y-6">
            <div className="bg-white border border-zinc-200 rounded-lg px-6 py-5">
              <h1 className="text-lg font-bold text-zinc-900">{p.projectName || "Project Proposal"}</h1>
              <p className="text-sm text-zinc-500 mt-0.5">Prepared for {p.companyName || p.clientName}</p>
              <div className="space-y-1.5 mt-4 pt-4 border-t border-zinc-100">
                {p.discount ? (
                  <>
                    <div className="flex items-center justify-between text-xs font-semibold text-zinc-500">
                      <span>Subtotal</span>
                      <span>{money(p.totalPrice, p.currency)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold text-red-500">
                      <span>Discount</span>
                      <span>-{money(p.discount, p.currency)}</span>
                    </div>
                  </>
                ) : null}
                <div className="flex items-center justify-between font-bold text-zinc-900 text-lg pt-1 border-t border-dashed border-zinc-100">
                  <span>Total</span>
                  <span>{money((p.totalPrice || 0) - (p.discount || 0), p.currency)}</span>
                </div>
              </div>
            </div>

            {p.refundPolicy && (
              <button onClick={() => setShowPolicyModal(true)}
                className="w-full flex items-center justify-between px-6 py-3.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer">
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-zinc-400" /> View Policy
                </span>
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              </button>
            )}

            <div className="bg-white border border-zinc-200 rounded-lg px-6 py-6">
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-zinc-900 animate-pulse">Sign this proposal</h2>
                {error && <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">{error}</div>}

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700">Full Name</label>
                  <input type="text" value={signerName} onChange={(e) => setSignerName(e.target.value)} placeholder="Your full name"
                    className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm" />
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-zinc-700">Signature</label>
                    {sigMode === "draw" && (
                      <button onClick={clearPad} className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-900 font-semibold transition-colors">
                        <Eraser className="w-3.5 h-3.5 text-zinc-400" /> Clear
                      </button>
                    )}
                  </div>
                  
                  <div className="flex gap-1.5 p-1 bg-zinc-100 rounded-lg">
                    <button onClick={() => setSigMode("draw")} className={`${tab} ${sigMode === "draw" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500"}`}><Pencil className="w-3.5 h-3.5" /> Draw</button>
                    <button onClick={() => setSigMode("type")} className={`${tab} ${sigMode === "type" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500"}`}><TypeIcon className="w-3.5 h-3.5" /> Type</button>
                    <button onClick={() => setSigMode("upload")} className={`${tab} ${sigMode === "upload" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500"}`}><Upload className="w-3.5 h-3.5" /> Upload</button>
                  </div>

                  {sigMode === "draw" && (
                    <div className="space-y-1.5">
                      <canvas ref={canvasRef} width={420} height={150}
                        onPointerDown={startDraw} onPointerMove={draw} onPointerUp={endDraw} onPointerLeave={endDraw}
                        className="w-full h-[150px] border border-zinc-300 rounded-lg bg-white touch-none cursor-crosshair" />
                      <p className="text-[11px] text-zinc-400 font-medium">Draw your signature inside the area using your mouse, trackpad, or finger.</p>
                    </div>
                  )}
                  {sigMode === "type" && (
                    <div className="space-y-1.5">
                      <div className="w-full h-[150px] border border-zinc-300 rounded-lg bg-white flex items-center justify-center px-4 overflow-hidden select-none">
                        <span className="text-3xl italic font-serif text-zinc-800 tracking-wide select-none" style={{ fontFamily: "'Brush Script MT', 'cursive', 'Georgia', 'serif'" }}>
                          {signerName.trim() || "Your Signature"}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 font-medium">A beautiful handwritten signature will be auto-generated from your typed full name.</p>
                    </div>
                  )}
                  {sigMode === "upload" && (
                    <div className="space-y-1.5">
                      {uploadedSig ? (
                        <div className="flex items-center justify-between border border-zinc-200 rounded-lg p-3 bg-zinc-50">
                          <div className="flex items-center gap-3">
                            <img src={uploadedSig} alt="signature" className="h-12 bg-white border border-zinc-100 rounded p-1 shadow-sm" />
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Image Uploaded</span>
                          </div>
                          <button onClick={() => setUploadedSig("")} className="text-xs font-semibold text-zinc-500 hover:text-red-600">Remove</button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center gap-1.5 py-6 border-2 border-dashed border-zinc-300 rounded-lg cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/30 text-sm text-zinc-500">
                          <Upload className="w-5 h-5 text-zinc-400" />
                          Upload signature image (PNG/JPG)
                          <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleSigUpload} />
                        </label>
                      )}
                    </div>
                  )}
                </div>

                <label className="flex items-start gap-2.5 text-sm text-zinc-600 cursor-pointer select-none">
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 w-4 h-4 accent-zinc-900 cursor-pointer" />
                  <span>I have reviewed and agree to the terms of this proposal. I understand that signing is legally binding.</span>
                </label>

                <div className="flex items-center gap-3">
                  <button onClick={() => submit("sign")} disabled={submitting}
                    className="flex items-center justify-center gap-2 flex-1 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-bold text-sm transition-colors disabled:opacity-50 cursor-pointer">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><FileSignature className="w-4 h-4" /> SIGN &amp; ACCEPT</>}
                  </button>
                  <button onClick={() => submit("reject")} disabled={submitting}
                    className="flex items-center justify-center gap-2 px-5 py-3 border border-zinc-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-zinc-600 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 cursor-pointer">
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-zinc-400">Powered by TEACHFOSYS · Fund Trac</p>
          </div>
        </div>
      </div>

      {showPolicyModal && p.refundPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setShowPolicyModal(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
          <div className="relative w-full max-w-lg bg-white border border-zinc-200 rounded-lg shadow-2xl flex flex-col p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4.5 h-4.5 text-zinc-500" />
                <h2 className="text-sm font-bold text-zinc-900">Policy</h2>
              </div>
              <button onClick={() => setShowPolicyModal(false)} className="p-1.5 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 rounded-md transition-colors cursor-pointer">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            <div className="text-xs text-zinc-600 bg-zinc-50 border border-zinc-150/80 rounded-lg p-4 whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
              {p.refundPolicy}
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setShowPolicyModal(false)} className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
