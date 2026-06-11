"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@/app/context/UserContext";
import Sidebar from "@/app/components/Sidebar";
import Navbar from "@/app/components/Navbar";
import { useRouter } from "next/navigation";
import {
  RefreshCw, Plus, Trash2, DollarSign, Calendar,
  Tag, ArrowUpRight, ArrowDownRight, Clock, Save,
  ShieldAlert, ChevronDown, Pencil,
} from "lucide-react";

const INCOME_CATEGORIES = ["Client Payment", "Product Sales", "Subscription Revenue", "Investment"];
const EXPENSE_CATEGORIES = [
  "Server / Hosting", "Domain", "Software Subscription",
  "Marketing", "Salary", "Office Expense", "Miscellaneous",
];
const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

interface Recurring {
  _id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  frequency: string;
  startDate: string;
  nextRunDate: string;
  lastRun?: string;
  project?: string;
  client?: string;
}

export default function RecurringPage() {
  const { user } = useUser();
  const router = useRouter();
  const [items, setItems] = useState<Recurring[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processMsg, setProcessMsg] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  // Form fields
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [startDate, setStartDate] = useState(new Date().toISOString().substring(0, 10));
  const [project, setProject] = useState("");
  const [client, setClient] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/recurring");
      if (res.ok) setItems(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // Auto-process on page load
  useEffect(() => {
    fetch("/api/recurring/process", { method: "POST" }).catch(() => {});
  }, []);

  const handleTypeChange = (t: "income" | "expense") => {
    setType(t);
    setCategory(t === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
  };

  const resetForm = () => {
    setAmount("");
    setDescription("");
    setProject("");
    setClient("");
    setType("expense");
    setCategory(EXPENSE_CATEGORIES[0]);
    setFrequency("monthly");
    setStartDate(new Date().toISOString().substring(0, 10));
    setEditId(null);
    setError("");
  };

  const handleEdit = (item: Recurring) => {
    setEditId(item._id);
    setType(item.type);
    setAmount(item.amount.toString());
    setCategory(item.category);
    setDescription(item.description);
    setFrequency(item.frequency);
    setStartDate(new Date(item.startDate).toISOString().substring(0, 10));
    setProject(item.project || "");
    setClient(item.client || "");
    setError("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!amount || !category || !description) {
      setError("Amount, category, and description are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editId ? `/api/recurring/${editId}` : "/api/recurring";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user?.role || "",
          "x-user-email": user?.email || "",
          "x-user-name": user?.name || "",
        },
        body: JSON.stringify({
          type, amount: Number(amount), category, description,
          frequency, startDate, project, client: type === "income" ? client : "",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save.");

      resetForm();
      setShowForm(false);
      fetchItems();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Stop this recurring transaction? It will no longer auto-create entries.")) return;
    try {
      const res = await fetch(`/api/recurring/${id}`, {
        method: "DELETE",
        headers: {
          "x-user-role": user?.role || "",
          "x-user-email": user?.email || "",
          "x-user-name": user?.name || "",
        },
      });
      if (!res.ok) throw new Error("Failed to delete.");
      fetchItems();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleManualProcess = async () => {
    setProcessing(true);
    setProcessMsg("");
    try {
      const res = await fetch("/api/recurring/process", { method: "POST" });
      const data = await res.json();
      setProcessMsg(data.message || "Done.");
      fetchItems();
    } catch (e) {
      setProcessMsg("Processing failed.");
    } finally {
      setProcessing(false);
    }
  };

  const frequencyBadge = (f: string) => {
    const colors: Record<string, string> = {
      daily: "bg-red-50 text-red-700 border-red-100",
      weekly: "bg-amber-50 text-amber-700 border-amber-100",
      monthly: "bg-blue-50 text-blue-700 border-blue-100",
      yearly: "bg-purple-50 text-purple-700 border-purple-100",
    };
    return colors[f] || "bg-zinc-50 text-zinc-700 border-zinc-100";
  };

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar />
      <div className="flex-grow pl-64 flex flex-col">
        <Navbar />
        <main className="flex-grow pt-20 px-8 pb-8 space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs text-zinc-500 font-medium">
                Auto-recurring entries are added to the ledger on schedule
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleManualProcess}
                disabled={processing}
                className="flex items-center gap-2 px-4 py-2 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 rounded-lg text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
                title="Manually trigger processing of any due transactions"
              >
                <RefreshCw className={`w-4 h-4 ${processing ? "animate-spin" : ""}`} />
                Run Now
              </button>
              {user?.role === "admin" && (
                <button
                  onClick={() => {
                    if (showForm) {
                      if (editId) {
                        resetForm();
                      } else {
                        setShowForm(false);
                      }
                    } else {
                      resetForm();
                      setShowForm(true);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Recurring
                </button>
              )}
            </div>
          </div>

          {processMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm font-medium">
              ✓ {processMsg}
            </div>
          )}

          {/* Add Form */}
          {showForm && user?.role === "admin" && (
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-zinc-100">
                <h2 className="text-base font-bold text-zinc-900">
                  {editId ? "Edit Recurring Transaction" : "New Recurring Transaction"}
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {editId
                    ? "Modify this auto-recurring transaction schedule."
                    : "This will automatically add a transaction to the ledger at every interval."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
                    <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                {/* Type */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => handleTypeChange("expense")}
                      className={`py-2.5 rounded-lg text-sm font-bold border transition-all flex items-center justify-center gap-2 ${
                        type === "expense" ? "bg-red-50 text-red-700 border-red-300" : "bg-zinc-50 text-zinc-500 border-zinc-200 hover:border-zinc-400"
                      }`}>
                      <ArrowDownRight className="w-4 h-4" /> Expense
                    </button>
                    <button type="button" onClick={() => handleTypeChange("income")}
                      className={`py-2.5 rounded-lg text-sm font-bold border transition-all flex items-center justify-center gap-2 ${
                        type === "income" ? "bg-emerald-50 text-emerald-700 border-emerald-300" : "bg-zinc-50 text-zinc-500 border-zinc-200 hover:border-zinc-400"
                      }`}>
                      <ArrowUpRight className="w-4 h-4" /> Income
                    </button>
                  </div>
                </div>

                {/* Amount & Category — full width */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700" htmlFor="rec-amount">
                    Amount (BDT) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                      <DollarSign className="w-4 h-4" />
                    </span>
                    <input id="rec-amount" type="number" required min="1" value={amount}
                      onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 1200"
                      className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700" htmlFor="rec-category">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                      <Tag className="w-4 h-4" />
                    </span>
                    <select id="rec-category" value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 border border-zinc-200 bg-white rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm appearance-none">
                      {(type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 pointer-events-none">
                      <ChevronDown className="w-4 h-4" />
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700" htmlFor="rec-desc">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <input id="rec-desc" type="text" required value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Monthly VPS server payment"
                    className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm" />
                </div>

                {/* Frequency & Start Date */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700">
                    Frequency <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {FREQUENCIES.map((f) => (
                      <button key={f.value} type="button" onClick={() => setFrequency(f.value)}
                        className={`py-2.5 rounded-lg text-sm font-bold border transition-all ${
                          frequency === f.value
                            ? "bg-zinc-900 text-white border-zinc-900"
                            : "bg-zinc-50 text-zinc-500 border-zinc-200 hover:border-zinc-400"
                        }`}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700" htmlFor="rec-start">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                      <Calendar className="w-4 h-4" />
                    </span>
                    <input id="rec-start" type="date" required value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm" />
                  </div>
                </div>

                {/* Project & Client */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-zinc-700" htmlFor="rec-project">Project <span className="text-zinc-400 font-normal">(optional)</span></label>
                    <input id="rec-project" type="text" value={project}
                      onChange={(e) => setProject(e.target.value)} placeholder="e.g. Fcomurs"
                      className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-zinc-700" htmlFor="rec-client">Client <span className="text-zinc-400 font-normal">(optional)</span></label>
                    <input id="rec-client" type="text" value={client}
                      onChange={(e) => setClient(e.target.value)} placeholder="Client name"
                      disabled={type === "expense"}
                      className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm disabled:opacity-40 disabled:cursor-not-allowed" />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button type="submit" disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50">
                    <Save className="w-4 h-4" />
                    {editId
                      ? (isSubmitting ? "Updating..." : "Update Schedule")
                      : (isSubmitting ? "Saving..." : "Save Recurring Schedule")}
                  </button>
                  <button type="button" onClick={() => { resetForm(); setShowForm(false); }}
                    className="px-6 py-2.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-lg font-semibold text-sm transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Recurring List */}
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100">
              <h2 className="font-bold text-sm text-zinc-900">Active Schedules</h2>
              <p className="text-xs text-zinc-400 mt-0.5">{items.length} recurring transaction{items.length !== 1 ? "s" : ""} configured</p>
            </div>

            {loading ? (
              <div className="py-12 text-center text-zinc-400 text-sm">Loading schedules...</div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <RefreshCw className="w-8 h-8 text-zinc-300 mx-auto" />
                <p className="text-zinc-400 text-sm">No recurring transactions yet.</p>
                <p className="text-zinc-300 text-xs">Add one to auto-record transactions on schedule.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 font-semibold text-zinc-500 uppercase">
                      <th className="pb-3 pl-6 py-3">Description</th>
                      <th className="pb-3 py-3">Type</th>
                      <th className="pb-3 py-3 text-right">Amount</th>
                      <th className="pb-3 py-3">Category</th>
                      <th className="pb-3 py-3">Frequency</th>
                      <th className="pb-3 py-3">Next Run</th>
                      <th className="pb-3 py-3">Last Run</th>
                      {user?.role === "admin" && <th className="pb-3 py-3 text-right pr-6">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {items.map((item) => (
                      <tr key={item._id} className="hover:bg-zinc-50 transition-colors">
                        <td className="py-4 pl-6 font-semibold text-zinc-900 max-w-xs">
                          <div className="truncate">{item.description}</div>
                          {item.project && (
                            <span className="text-[10px] bg-zinc-100 text-zinc-600 font-bold px-1.5 py-0.5 rounded mt-1 inline-block">
                              📁 {item.project}
                            </span>
                          )}
                        </td>
                        <td className="py-4">
                          <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full border ${
                            item.type === "income"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : "bg-red-50 text-red-700 border-red-100"
                          }`}>
                            {item.type === "income" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {item.type}
                          </span>
                        </td>
                        <td className={`py-4 text-right font-bold ${item.type === "income" ? "text-emerald-700" : "text-red-700"}`}>
                          {item.type === "income" ? "+" : "-"}{item.amount.toLocaleString()} BDT
                        </td>
                        <td className="py-4 text-zinc-600">{item.category}</td>
                        <td className="py-4">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border capitalize ${frequencyBadge(item.frequency)}`}>
                            <Clock className="w-3 h-3" />
                            {item.frequency}
                          </span>
                        </td>
                        <td className="py-4 text-zinc-700 font-semibold">
                          {new Date(item.nextRunDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="py-4 text-zinc-400">
                          {item.lastRun
                            ? new Date(item.lastRun).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                            : "—"}
                        </td>
                        {user?.role === "admin" && (
                          <td className="py-4 text-right pr-6">
                            <div className="inline-flex gap-2">
                              <button
                                onClick={() => handleEdit(item)}
                                className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
                                title="Edit this recurring schedule"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(item._id)}
                                className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                title="Stop this recurring schedule"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Info Banner */}
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 text-xs text-blue-700">
            <RefreshCw className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">How it works: </span>
              When this page loads or you click "Run Now", the system checks all scheduled transactions. Any that are due are automatically added to the Ledger with an [Auto] tag. The next run date is then updated based on the frequency.
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
