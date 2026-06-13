"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Building, CheckCircle2, FileSignature, Loader2, XCircle, Eraser, Lock, Pencil, Upload, Type as TypeIcon } from "lucide-react";
import PdfViewer from "@/app/components/PdfViewer";

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
  currency: string;
  pdfFile?: string;
  status: "draft" | "sent" | "viewed" | "signed" | "rejected";
  signerName?: string;
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
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-6">
        <div className="max-w-md w-full bg-white border border-zinc-200 rounded-2xl shadow-xl px-8 py-12 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-zinc-950">Proposal Signed</h2>
            <p className="text-sm text-zinc-500">
              Thank you{nameForDisplay ? `, ${nameForDisplay}` : ""}! The signed proposal has been successfully submitted and a finalized PDF copy has been sent to your email.
            </p>
          </div>
          <p className="text-xs text-zinc-400">Powered by TEACHFOSYS · Fund Trac</p>
        </div>
      </div>
    );
  }

  if (result === "rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-6">
        <div className="max-w-md w-full bg-white border border-zinc-200 rounded-2xl shadow-xl px-8 py-12 text-center space-y-6">
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
      <div className="max-w-6xl mx-auto">
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
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-semibold mb-3">
              <Lock className="w-3.5 h-3.5" /> View only — download disabled
            </div>
            <PdfViewer data={p.pdfFile} />
          </div>

          {/* Sign panel */}
          <div className="lg:sticky lg:top-6 space-y-6">
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm px-6 py-5">
              <h1 className="text-lg font-bold text-zinc-900">{p.projectName || "Project Proposal"}</h1>
              <p className="text-sm text-zinc-500 mt-0.5">Prepared for {p.companyName || p.clientName}</p>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-100">
                <span className="text-xs font-semibold text-zinc-500 uppercase">Total</span>
                <span className="text-xl font-bold text-zinc-900">{money(p.totalPrice, p.currency)}</span>
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm px-6 py-6">
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-zinc-900">Sign this proposal</h2>
                {error && <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">{error}</div>}

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700">Full Name</label>
                  <input type="text" value={signerName} onChange={(e) => setSignerName(e.target.value)} placeholder="Your full name"
                    className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm" />
                </div>

                {/* Signature: draw or upload */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-zinc-700">Signature</label>
                    {sigMode === "draw" && <button onClick={clearPad} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900"><Eraser className="w-3.5 h-3.5" /> Clear</button>}
                  </div>
                  <div className="flex gap-1.5 p-1 bg-zinc-100 rounded-xl">
                    <button onClick={() => setSigMode("draw")} className={`${tab} ${sigMode === "draw" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500"}`}><Pencil className="w-3.5 h-3.5" /> Draw</button>
                    <button onClick={() => setSigMode("type")} className={`${tab} ${sigMode === "type" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500"}`}><TypeIcon className="w-3.5 h-3.5" /> Type</button>
                    <button onClick={() => setSigMode("upload")} className={`${tab} ${sigMode === "upload" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500"}`}><Upload className="w-3.5 h-3.5" /> Upload</button>
                  </div>

                  {sigMode === "draw" && (
                    <>
                      <canvas ref={canvasRef} width={420} height={150}
                        onPointerDown={startDraw} onPointerMove={draw} onPointerUp={endDraw} onPointerLeave={endDraw}
                        className="w-full h-[150px] border border-zinc-300 rounded-lg bg-white touch-none cursor-crosshair" />
                      <p className="text-[11px] text-zinc-400">Draw your signature using your mouse or finger.</p>
                    </>
                  )}
                  {sigMode === "type" && (
                    <>
                      <div className="w-full h-[150px] border border-zinc-300 rounded-lg bg-white flex items-center justify-center px-4 overflow-hidden select-none">
                        <span className="text-3xl italic font-serif text-zinc-800 tracking-wide" style={{ fontFamily: "'Brush Script MT', 'cursive', 'Georgia', 'serif'" }}>
                          {signerName.trim() || "Your Signature"}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400">A beautiful handwriting style signature will be generated from your name.</p>
                    </>
                  )}
                  {sigMode === "upload" && (
                    <div>
                      {uploadedSig ? (
                        <div className="flex items-center gap-3 border border-zinc-200 rounded-lg p-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={uploadedSig} alt="signature" className="h-16 bg-white border border-zinc-100 rounded p-1" />
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

                <label className="flex items-start gap-2.5 text-sm text-zinc-600 cursor-pointer">
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 w-4 h-4 accent-zinc-900" />
                  <span>I have reviewed and agree to the terms of this proposal. I understand that signing is legally binding.</span>
                </label>

                <div className="flex items-center gap-3">
                  <button onClick={() => submit("sign")} disabled={submitting}
                    className="flex items-center justify-center gap-2 flex-1 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><FileSignature className="w-4 h-4" /> Sign &amp; Accept</>}
                  </button>
                  <button onClick={() => submit("reject")} disabled={submitting}
                    className="flex items-center justify-center gap-2 px-5 py-3 border border-zinc-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-zinc-600 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50">
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-zinc-400">Powered by TEACHFOSYS · Fund Trac</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Done({ icon, title, text }: { icon: "ok" | "no"; title: string; text: string }) {
  return (
    <div className="text-center py-4">
      <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${icon === "ok" ? "bg-emerald-50" : "bg-red-50"}`}>
        {icon === "ok" ? <CheckCircle2 className="w-8 h-8 text-emerald-600" /> : <XCircle className="w-8 h-8 text-red-500" />}
      </div>
      <h2 className="text-lg font-bold text-zinc-900">{title}</h2>
      <p className="text-sm text-zinc-500 mt-1">{text}</p>
    </div>
  );
}
