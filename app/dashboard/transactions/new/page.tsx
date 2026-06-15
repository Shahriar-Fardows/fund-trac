"use client";

import React, { useState } from "react";
import { useUser } from "@/app/context/UserContext";
import Sidebar from "@/app/components/Sidebar";
import Navbar from "@/app/components/Navbar";
import { useRouter } from "next/navigation";
import { DollarSign, Calendar, Tag, ChevronLeft, Save, Paperclip } from "lucide-react";
import Swal from "sweetalert2";

const INCOME_CATEGORIES = ["Client Payment", "Product Sales", "Subscription Revenue", "Investment"];
const EXPENSE_CATEGORIES = [
  "Server / Hosting", "Domain", "Software Subscription",
  "Marketing", "Salary", "Office Expense", "Miscellaneous",
];

export default function NewTransactionPage() {
  const { user } = useUser();
  const router = useRouter();

  const [type, setType] = useState<"income" | "expense">("income");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(INCOME_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [project, setProject] = useState("");
  const [client, setClient] = useState("");
  const [receiptImage, setReceiptImage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"pending" | "partial" | "completed" | "refunded">("completed");
  const [receivedAmount, setReceivedAmount] = useState("");

  if (user?.role !== "admin") {
    router.push("/dashboard/transactions");
    return null;
  }

  const handleTypeChange = (newType: "income" | "expense") => {
    setType(newType);
    setCategory(newType === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({
        title: "File too large",
        text: "File size exceeds 2MB limit.",
        icon: "warning",
        confirmButtonColor: "#ef4444",
      });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setReceiptImage(reader.result as string);
    reader.readAsDataURL(file);
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
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user?.role || "",
          "x-user-email": user?.email || "",
          "x-user-name": user?.name || "",
        },
        body: JSON.stringify({
          type, amount: Number(amount), category, description,
          date, project, client: type === "income" ? client : "", receiptImage,
          status,
          receivedAmount: status === "completed" ? Number(amount) : (status === "pending" || status === "refunded" ? 0 : Number(receivedAmount)),
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to save."); }
      router.push("/dashboard/transactions");
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  const fieldClass = "w-full px-4 py-2.5 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm bg-white";
  const iconFieldClass = "w-full pl-10 pr-4 py-2.5 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm bg-white";

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar />
      <div className="flex-grow pl-64 flex flex-col">
        <Navbar />
        <main className="flex-grow pt-20 px-8 pb-8">

          <button
            onClick={() => router.push("/dashboard/transactions")}
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 font-medium mb-6 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Ledger
          </button>

          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden w-full">
            <div className="px-8 py-5 border-b border-zinc-100">
              <h1 className="text-lg font-bold text-zinc-900">Record Transaction</h1>
              <p className="text-xs text-zinc-500 mt-0.5">Add a new income or expense entry to the ledger.</p>
            </div>

            <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
                  {error}
                </div>
              )}

              {/* Row 1: Type selector — full width */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-zinc-700">
                  Transaction Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => handleTypeChange("income")}
                    className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                      type === "income"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-400"
                        : "bg-zinc-50 text-zinc-500 border-zinc-200 hover:border-zinc-400"
                    }`}>
                    ↑ Income
                  </button>
                  <button type="button" onClick={() => handleTypeChange("expense")}
                    className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                      type === "expense"
                        ? "bg-red-50 text-red-700 border-red-400"
                        : "bg-zinc-50 text-zinc-500 border-zinc-200 hover:border-zinc-400"
                    }`}>
                    ↓ Expense
                  </button>
                </div>
              </div>

              {/* Row 2: Amount | Category | Date — 3 columns */}
              <div className="grid grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700" htmlFor="amount">
                    Amount (BDT) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                      <DollarSign className="w-4 h-4" />
                    </span>
                    <input id="amount" type="number" required min="1" value={amount}
                      onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 5000"
                      className={iconFieldClass} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700" htmlFor="category">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                      <Tag className="w-4 h-4" />
                    </span>
                    <select id="category" value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className={iconFieldClass}>
                      {(type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
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

              {/* Row 3: Description — full width */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-zinc-700" htmlFor="description">
                  Description <span className="text-red-500">*</span>
                </label>
                <input id="description" type="text" required value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this transaction"
                  className={fieldClass} />
              </div>

              {/* Row 4: Project | Client | Receipt — 3 columns */}
              <div className="grid grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700" htmlFor="project">
                    Project <span className="text-zinc-400 font-normal">(optional)</span>
                  </label>
                  <input id="project" type="text" value={project}
                    onChange={(e) => setProject(e.target.value)} placeholder="e.g. Fcomurs"
                    className={fieldClass} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700" htmlFor="client">
                    Client <span className="text-zinc-400 font-normal">(optional)</span>
                  </label>
                  <input id="client" type="text" value={client}
                    onChange={(e) => setClient(e.target.value)} placeholder="Client name"
                    disabled={type === "expense"}
                    className={`${fieldClass} disabled:opacity-40 disabled:cursor-not-allowed`} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700">
                    Receipt <span className="text-zinc-400 font-normal">(optional, max 2MB)</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2.5 border border-dashed border-zinc-300 rounded-lg cursor-pointer hover:border-zinc-500 hover:bg-zinc-50 transition-colors h-[42px]">
                    <Paperclip className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                    <span className="text-sm text-zinc-500 truncate">
                      {receiptImage ? "✔ Attached" : "Click to attach"}
                    </span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Row 5: Status | Received Amount — 2 columns */}
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700" htmlFor="status">
                    Payment Status <span className="text-red-500">*</span>
                  </label>
                  <select id="status" value={status}
                    onChange={(e) => {
                      const newStatus = e.target.value as any;
                      setStatus(newStatus);
                      if (newStatus === "completed") setReceivedAmount(amount);
                      else if (newStatus === "pending") setReceivedAmount("0");
                      else if (newStatus === "refunded") setReceivedAmount("0");
                      else setReceivedAmount("");
                    }}
                    className={fieldClass}>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700" htmlFor="receivedAmount">
                    Received Amount (BDT)
                  </label>
                  <input id="receivedAmount" type="number"
                    value={status === "completed" ? amount : (status === "pending" || status === "refunded" ? "0" : receivedAmount)}
                    onChange={(e) => setReceivedAmount(e.target.value)}
                    disabled={status !== "partial"}
                    placeholder={status === "completed" ? amount : (status === "pending" || status === "refunded" ? "0" : "Enter received amount")}
                    className={`${fieldClass} disabled:bg-zinc-50 disabled:opacity-70 disabled:cursor-not-allowed`} />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2 border-t border-zinc-100">
                <button type="submit" disabled={isSubmitting}
                  className="flex items-center gap-2 px-8 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50">
                  <Save className="w-4 h-4" />
                  {isSubmitting ? "Saving..." : "Save Transaction"}
                </button>
                <button type="button" onClick={() => router.push("/dashboard/transactions")}
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
