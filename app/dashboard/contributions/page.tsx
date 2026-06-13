"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/app/context/UserContext";
import Sidebar from "@/app/components/Sidebar";
import Navbar from "@/app/components/Navbar";
import { Plus, Pencil, Trash2, Coins, Award } from "lucide-react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

interface Contribution {
  _id: string;
  partnerName: string;
  amount: number;
  date: string;
  note?: string;
}

export default function ContributionsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContributions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/contributions");
      if (res.ok) setContributions(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchContributions(); }, []);

  const handleDelete = async (id: string) => {
    const resConfirm = await Swal.fire({
      title: "Delete contribution?",
      text: "Are you sure you want to delete this contribution?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#71717a",
      confirmButtonText: "Yes, delete it",
    });
    if (!resConfirm.isConfirmed) return;
    try {
      const res = await fetch(`/api/contributions/${id}`, {
        method: "DELETE",
        headers: {
          "x-user-role": user?.role || "",
          "x-user-email": user?.email || "",
          "x-user-name": user?.name || "",
        },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }
      fetchContributions();
      Swal.fire({
        title: "Deleted!",
        text: "The contribution has been deleted.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire("Error!", err.message, "error");
    }
  };

  const totalContributions = contributions.reduce((acc, c) => acc + c.amount, 0);

  const partnerTotals: Record<string, number> = {};
  contributions.forEach((c) => {
    partnerTotals[c.partnerName] = (partnerTotals[c.partnerName] || 0) + c.amount;
  });

  const ownershipList = Object.keys(partnerTotals).map((name) => ({
    name,
    amount: partnerTotals[name],
    percentage: totalContributions > 0 ? (partnerTotals[name] / totalContributions) * 100 : 0,
  })).sort((a, b) => b.amount - a.amount);

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar />
      <div className="flex-grow pl-64 flex flex-col">
        <Navbar />

        <main className="flex-grow pt-20 px-8 pb-8 space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500 font-medium">Manage and view partner equity fundings</p>
            {user?.role === "admin" && (
              <button
                onClick={() => router.push("/dashboard/contributions/new")}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Contribution
              </button>
            )}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-zinc-500 uppercase">Total Invested Capital</span>
                <h3 className="text-2xl font-bold text-zinc-900">{totalContributions.toLocaleString()} BDT</h3>
                <span className="text-[10px] text-zinc-400 font-medium block">Aggregated from all partners</span>
              </div>
              <div className="w-12 h-12 bg-zinc-900 text-white rounded-xl flex items-center justify-center shadow-md">
                <Coins className="w-6 h-6" />
              </div>
            </div>

            <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="font-bold text-sm text-zinc-900 uppercase tracking-tight">Equity Distribution</h4>
              {ownershipList.length === 0 ? (
                <p className="text-sm text-zinc-400">No contributions yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {ownershipList.map((partner, idx) => (
                    <div key={idx} className="border border-zinc-100 rounded-xl p-3 bg-zinc-50 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-zinc-900 truncate">{partner.name}</span>
                        <Award className="w-4 h-4 text-zinc-400" />
                      </div>
                      <h5 className="font-bold text-sm text-zinc-900">{partner.amount.toLocaleString()} BDT</h5>
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 font-medium">
                        <span>Ownership</span>
                        <span className="font-bold text-zinc-900">{partner.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Contributions Table */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="font-bold text-sm text-zinc-900 uppercase tracking-tight">Funding History</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 font-semibold text-zinc-500 uppercase">
                    <th className="pb-3 pl-2">Partner Name</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Notes</th>
                    {user?.role === "admin" && <th className="pb-3 text-right pr-2">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-800">
                  {loading ? (
                    <tr><td colSpan={5} className="py-8 text-center text-zinc-400">Loading...</td></tr>
                  ) : contributions.length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-zinc-400">No contributions yet. Add one to get started.</td></tr>
                  ) : (
                    contributions.map((c) => (
                      <tr key={c._id} className="hover:bg-zinc-50 transition-colors">
                        <td className="py-3.5 pl-2 font-semibold text-zinc-900 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-700 font-bold text-[10px]">
                            {c.partnerName.slice(0, 2).toUpperCase()}
                          </div>
                          {c.partnerName}
                        </td>
                        <td className="py-3.5 text-right font-bold text-zinc-900">{c.amount.toLocaleString()} BDT</td>
                        <td className="py-3.5 text-zinc-500">
                          {new Date(c.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="py-3.5 text-zinc-400 italic max-w-xs truncate">{c.note || "—"}</td>
                        {user?.role === "admin" && (
                          <td className="py-3.5 text-right pr-2">
                            <div className="inline-flex gap-2">
                              <button
                                onClick={() => router.push(`/dashboard/contributions/${c._id}/edit`)}
                                className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
                                title="Edit"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(c._id)}
                                className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
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

        </main>
      </div>
    </div>
  );
}
