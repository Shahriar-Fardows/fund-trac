"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/app/context/UserContext";
import Sidebar from "@/app/components/Sidebar";
import Navbar from "@/app/components/Navbar";
import {
  Plus, Pencil, Trash2, Search, Filter,
  FileSpreadsheet, FileText, ArrowUpRight,
  ArrowDownRight, Paperclip, Eye, X,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Transaction {
  _id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: string;
  receiptImage?: string;
  client?: string;
  project?: string;
}

export default function TransactionsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Receipt image viewer (only kept as lightweight inline viewer, not a modal form)
  const [viewImage, setViewImage] = useState<string | null>(null);

  const ALL_CATEGORIES = [
    "Client Payment", "Product Sales", "Subscription Revenue", "Investment",
    "Server / Hosting", "Domain", "Software Subscription",
    "Marketing", "Salary", "Office Expense", "Miscellaneous",
  ];

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filterType) params.append("type", filterType);
      if (filterCategory) params.append("category", filterCategory);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (res.ok) setTransactions(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, [search, filterType, filterCategory, startDate, endDate]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this transaction from the ledger?")) return;
    try {
      const res = await fetch(`/api/transactions/${id}`, {
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
      fetchTransactions();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) return;
    const headers = ["Date", "Type", "Category", "Amount (BDT)", "Description", "Project", "Client"];
    const rows = transactions.map((t) => [
      new Date(t.date).toLocaleDateString("en-GB"),
      t.type.toUpperCase(),
      t.category,
      t.amount,
      `"${t.description.replace(/"/g, '""')}"`,
      t.project || "",
      t.client || "",
    ]);
    const csvContent = "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `fund_trac_ledger_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const tableRows = transactions.map((t) => `
      <tr>
        <td>${new Date(t.date).toLocaleDateString("en-GB")}</td>
        <td style="font-weight:bold;color:${t.type === "income" ? "#10b981" : "#ef4444"}">${t.type.toUpperCase()}</td>
        <td>${t.category}</td>
        <td>${t.description}</td>
        <td>${t.project || "—"}</td>
        <td>${t.client || "—"}</td>
        <td style="text-align:right;font-weight:bold;">${t.amount.toLocaleString()} BDT</td>
      </tr>`).join("");
    printWindow.document.write(`
      <html><head><title>Fund Trac Ledger</title>
      <style>body{font-family:Arial,sans-serif;padding:20px}table{width:100%;border-collapse:collapse;font-size:12px}
      th,td{border-bottom:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5;font-weight:bold}</style></head>
      <body><h1>Fund Trac Ledger Report</h1><h3 style="color:#666;font-weight:normal">Generated ${new Date().toLocaleDateString("en-GB")}</h3>
      <table><thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Description</th><th>Project</th><th>Client</th><th>Amount</th></tr></thead>
      <tbody>${tableRows}</tbody></table>
      <script>window.onload=function(){window.print();window.close()}<\/script></body></html>`);
    printWindow.document.close();
  };

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar />
      <div className="flex-grow pl-64 flex flex-col">
        <Navbar />

        <main className="flex-grow pt-20 px-8 pb-8 space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-xs text-zinc-500 font-medium">Record, track, and audit all cash flows</p>
            <div className="flex items-center gap-3">
              <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 py-2 border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-xs font-semibold rounded-lg transition-colors bg-white shadow-sm">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Export CSV
              </button>
              <button onClick={handleExportPDF} className="flex items-center gap-1.5 px-3 py-2 border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-xs font-semibold rounded-lg transition-colors bg-white shadow-sm">
                <FileText className="w-4 h-4 text-red-600" />
                Export PDF
              </button>
              {user?.role === "admin" && (
                <button
                  onClick={() => router.push("/dashboard/transactions/new")}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Transaction
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-3">
              <Filter className="w-4 h-4" />
              Filter Records
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Search</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-400" />
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Description, client..."
                    className="w-full pl-7 pr-3 py-1.5 border border-zinc-200 rounded-lg text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Type</label>
                <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setFilterCategory(""); }}
                  className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg text-xs text-zinc-800 bg-white focus:outline-none">
                  <option value="">All Types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Category</label>
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg text-xs text-zinc-800 bg-white focus:outline-none">
                  <option value="">All</option>
                  {ALL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">From</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg text-xs text-zinc-800 focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">To</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg text-xs text-zinc-800 focus:outline-none" />
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 font-semibold text-zinc-500 uppercase">
                    <th className="pb-3 pl-2">Date</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Description</th>
                    <th className="pb-3">Project / Client</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3 text-center">Receipt</th>
                    {user?.role === "admin" && <th className="pb-3 text-right pr-2">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {loading ? (
                    <tr><td colSpan={8} className="py-8 text-center text-zinc-400">Loading ledger...</td></tr>
                  ) : transactions.length === 0 ? (
                    <tr><td colSpan={8} className="py-8 text-center text-zinc-400">No transactions found.</td></tr>
                  ) : (
                    transactions.map((t) => (
                      <tr key={t._id} className="hover:bg-zinc-50 transition-colors">
                        <td className="py-3.5 pl-2 text-zinc-500">
                          {new Date(t.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="py-3.5">
                          <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full ${
                            t.type === "income"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-red-50 text-red-700 border border-red-100"
                          }`}>
                            {t.type === "income" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {t.type}
                          </span>
                        </td>
                        <td className="py-3.5 font-medium text-zinc-900">{t.category}</td>
                        <td className="py-3.5 text-zinc-600 max-w-xs truncate" title={t.description}>{t.description}</td>
                        <td className="py-3.5">
                          <div className="space-y-0.5">
                            {t.project && <span className="block text-[10px] bg-zinc-100 text-zinc-700 font-bold px-1.5 py-0.5 rounded w-max">📁 {t.project}</span>}
                            {t.client && <span className="block text-[10px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded w-max">👤 {t.client}</span>}
                            {!t.project && !t.client && <span className="text-zinc-400">—</span>}
                          </div>
                        </td>
                        <td className={`py-3.5 text-right font-bold ${t.type === "income" ? "text-emerald-700" : "text-red-700"}`}>
                          {t.type === "income" ? "+" : "-"}{t.amount.toLocaleString()} BDT
                        </td>
                        <td className="py-3.5 text-center">
                          {t.receiptImage ? (
                            <button
                              onClick={() => setViewImage(t.receiptImage!)}
                              className="p-1 rounded-md text-zinc-500 hover:bg-zinc-100 border border-zinc-200 bg-white inline-flex items-center gap-1 text-[10px] font-semibold"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </button>
                          ) : (
                            <span className="text-zinc-300 text-[10px]">—</span>
                          )}
                        </td>
                        {user?.role === "admin" && (
                          <td className="py-3.5 text-right pr-2">
                            <div className="inline-flex gap-2">
                              <button
                                onClick={() => router.push(`/dashboard/transactions/${t._id}/edit`)}
                                className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(t._id)}
                                className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
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

      {/* Receipt viewer — kept as lightweight overlay, not a full form modal */}
      {viewImage && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6" onClick={() => setViewImage(null)}>
          <div className="relative max-w-2xl w-full bg-white rounded-2xl p-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setViewImage(null)} className="absolute top-3 right-3 bg-zinc-900 text-white p-1.5 rounded-full">
              <X className="w-4 h-4" />
            </button>
            <img src={viewImage} alt="Receipt" className="w-full h-auto rounded-xl max-h-[80vh] object-contain" />
          </div>
        </div>
      )}

    </div>
  );
}
