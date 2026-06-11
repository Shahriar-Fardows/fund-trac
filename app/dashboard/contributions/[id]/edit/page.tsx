"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/app/context/UserContext";
import Sidebar from "@/app/components/Sidebar";
import Navbar from "@/app/components/Navbar";
import { useRouter } from "next/navigation";
import { Coins, Calendar, FileText, User, ChevronLeft, Save } from "lucide-react";

export default function EditContributionPage({ params }: { params: Promise<any> }) {
  const { user } = useUser();
  const router = useRouter();

  const [id, setId] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(async (p) => {
      setId(p.id);
      try {
        const res = await fetch("/api/contributions");
        if (res.ok) {
          const data = await res.json();
          const c = data.find((x: any) => x._id === p.id);
          if (c) {
            setPartnerName(c.partnerName);
            setAmount(c.amount.toString());
            setDate(new Date(c.date).toISOString().substring(0, 10));
            setNote(c.note || "");
          } else { router.push("/dashboard/contributions"); }
        }
      } catch { router.push("/dashboard/contributions"); }
      finally { setLoading(false); }
    });
  }, [params, router]);

  if (user?.role !== "admin") { router.push("/dashboard/contributions"); return null; }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!partnerName || !amount) { setError("Partner name and amount are required."); return; }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/contributions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user?.role || "",
          "x-user-email": user?.email || "",
          "x-user-name": user?.name || "",
        },
        body: JSON.stringify({ partnerName, amount: Number(amount), date, note }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to update."); }
      router.push("/dashboard/contributions");
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  const iconFieldClass = "w-full pl-10 pr-4 py-2.5 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm bg-white";

  if (loading) {
    return (
      <div className="flex min-h-screen bg-zinc-50">
        <Sidebar />
        <div className="flex-grow pl-64 flex flex-col">
          <Navbar />
          <div className="flex-grow flex items-center justify-center pt-16">
            <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar />
      <div className="flex-grow pl-64 flex flex-col">
        <Navbar />
        <main className="flex-grow pt-20 px-8 pb-8">

          <button
            onClick={() => router.push("/dashboard/contributions")}
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 font-medium mb-6 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Contributions
          </button>

          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden w-full">
            <div className="px-8 py-5 border-b border-zinc-100">
              <h1 className="text-lg font-bold text-zinc-900">Edit Contribution</h1>
              <p className="text-xs text-zinc-500 mt-0.5">Update the details of this capital contribution.</p>
            </div>

            <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
                  {error}
                </div>
              )}

              {/* Row 1: Partner Name | Amount | Date — 3 columns */}
              <div className="grid grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700" htmlFor="partnerName">
                    Partner Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input id="partnerName" type="text" required value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                      className={iconFieldClass} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700" htmlFor="amount">
                    Amount (BDT) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                      <Coins className="w-4 h-4" />
                    </span>
                    <input id="amount" type="number" required min="1" value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className={iconFieldClass} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700" htmlFor="date">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                      <Calendar className="w-4 h-4" />
                    </span>
                    <input id="date" type="date" required value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className={iconFieldClass} />
                  </div>
                </div>
              </div>

              {/* Row 2: Note — full width */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-zinc-700" htmlFor="note">
                  Note <span className="text-zinc-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute top-3 left-3 text-zinc-400">
                    <FileText className="w-4 h-4" />
                  </span>
                  <textarea id="note" value={note} onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm bg-white resize-none" />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2 border-t border-zinc-100">
                <button type="submit" disabled={isSubmitting}
                  className="flex items-center gap-2 px-8 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50">
                  <Save className="w-4 h-4" />
                  {isSubmitting ? "Saving..." : "Update Contribution"}
                </button>
                <button type="button" onClick={() => router.push("/dashboard/contributions")}
                  className="px-6 py-2.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-lg font-semibold text-sm transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>

        </main>
      </div>
    </div>
  );
}
