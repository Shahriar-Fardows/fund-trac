"use client";

import React, { useState } from "react";
import { useUser } from "@/app/context/UserContext";
import Sidebar from "@/app/components/Sidebar";
import Navbar from "@/app/components/Navbar";
import { useRouter } from "next/navigation";
import { Coins, Calendar, FileText, User, ChevronLeft, Save } from "lucide-react";

export default function NewContributionPage() {
  const { user } = useUser();
  const router = useRouter();

  const [partnerName, setPartnerName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user?.role !== "admin") {
    router.push("/dashboard/contributions");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!partnerName || !amount) {
      setError("Partner name and amount are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/contributions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user?.role || "",
          "x-user-email": user?.email || "",
          "x-user-name": user?.name || "",
        },
        body: JSON.stringify({ partnerName, amount: Number(amount), date, note }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save.");
      }

      router.push("/dashboard/contributions");
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar />
      <div className="flex-grow pl-64 flex flex-col">
        <Navbar />
        <main className="flex-grow pt-20 px-8 pb-8">
          <div className="max-w-xl mx-auto">

            {/* Back link */}
            <button
              onClick={() => router.push("/dashboard/contributions")}
              className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 font-medium mb-6 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Contributions
            </button>

            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-zinc-100">
                <h1 className="text-lg font-bold text-zinc-900">Add Partner Contribution</h1>
                <p className="text-xs text-zinc-500 mt-0.5">Record a new capital contribution from a partner or investor.</p>
              </div>

              <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700" htmlFor="partnerName">
                    Partner Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      id="partnerName"
                      type="text"
                      required
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                      placeholder="e.g. Shahriar"
                      className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm"
                    />
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
                    <input
                      id="amount"
                      type="number"
                      required
                      min="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 10000"
                      className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm"
                    />
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
                    <input
                      id="date"
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700" htmlFor="note">
                    Note <span className="text-zinc-400 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute top-3 left-3 text-zinc-400">
                      <FileText className="w-4 h-4" />
                    </span>
                    <textarea
                      id="note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="e.g. Initial fund, Monthly contribution..."
                      rows={3}
                      className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm resize-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {isSubmitting ? "Saving..." : "Save Contribution"}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard/contributions")}
                    className="px-6 py-2.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-lg font-semibold text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
