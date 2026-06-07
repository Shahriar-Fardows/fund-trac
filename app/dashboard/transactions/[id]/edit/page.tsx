"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/app/context/UserContext";
import Sidebar from "@/app/components/Sidebar";
import Navbar from "@/app/components/Navbar";
import { useRouter } from "next/navigation";
import { DollarSign, Calendar, Tag, ChevronLeft, Save, Paperclip } from "lucide-react";

const INCOME_CATEGORIES = ["Client Payment", "Product Sales", "Subscription Revenue", "Investment"];
const EXPENSE_CATEGORIES = [
  "Server / Hosting", "Domain", "Software Subscription",
  "Marketing", "Salary", "Office Expense", "Miscellaneous",
];

export default function EditTransactionPage({ params }: { params: Promise<any> }) {
  const { user } = useUser();
  const router = useRouter();

  const [id, setId] = useState<string | null>(null);
  const [type, setType] = useState<"income" | "expense">("income");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(INCOME_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [project, setProject] = useState("");
  const [client, setClient] = useState("");
  const [receiptImage, setReceiptImage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(async (p) => {
      setId(p.id);
      try {
        const res = await fetch("/api/transactions");
        if (res.ok) {
          const data = await res.json();
          const t = data.find((tx: any) => tx._id === p.id);
          if (t) {
            setType(t.type);
            setAmount(t.amount.toString());
            setCategory(t.category);
            setDescription(t.description);
            setDate(new Date(t.date).toISOString().substring(0, 10));
            setProject(t.project || "");
            setClient(t.client || "");
            setReceiptImage(t.receiptImage || "");
          } else {
            router.push("/dashboard/transactions");
          }
        }
      } catch (e) {
        router.push("/dashboard/transactions");
      } finally {
        setLoading(false);
      }
    });
  }, [params, router]);

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
      alert("File size exceeds 2MB limit.");
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
      const res = await fetch(`/api/transactions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user?.role || "",
          "x-user-email": user?.email || "",
          "x-user-name": user?.name || "",
        },
        body: JSON.stringify({
          type, amount: Number(amount), category, description,
          date, project, client: type === "income" ? client : "", receiptImage,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update.");
      }

      router.push("/dashboard/transactions");
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

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
          <div className="max-w-xl mx-auto">

            <button
              onClick={() => router.push("/dashboard/transactions")}
              className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 font-medium mb-6 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Ledger
            </button>

            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-zinc-100">
                <h1 className="text-lg font-bold text-zinc-900">Edit Transaction</h1>
                <p className="text-xs text-zinc-500 mt-0.5">Update the details of this ledger entry.</p>
              </div>

              <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700">
                    Transaction Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleTypeChange("income")}
                      className={`py-2.5 rounded-lg text-sm font-bold border transition-all ${
                        type === "income"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                          : "bg-zinc-50 text-zinc-500 border-zinc-200 hover:border-zinc-400"
                      }`}
                    >
                      ↑ Income
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTypeChange("expense")}
                      className={`py-2.5 rounded-lg text-sm font-bold border transition-all ${
                        type === "expense"
                          ? "bg-red-50 text-red-700 border-red-300"
                          : "bg-zinc-50 text-zinc-500 border-zinc-200 hover:border-zinc-400"
                      }`}
                    >
                      ↓ Expense
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700" htmlFor="amount">
                    Amount (BDT) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                      <DollarSign className="w-4 h-4" />
                    </span>
                    <input
                      id="amount"
                      type="number"
                      required
                      min="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm"
                    />
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
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 bg-white rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm"
                    >
                      {(type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700" htmlFor="description">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="description"
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm"
                  />
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-zinc-700" htmlFor="project">
                      Project <span className="text-zinc-400 font-normal">(optional)</span>
                    </label>
                    <input
                      id="project"
                      type="text"
                      value={project}
                      onChange={(e) => setProject(e.target.value)}
                      className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-zinc-700" htmlFor="client">
                      Client <span className="text-zinc-400 font-normal">(optional)</span>
                    </label>
                    <input
                      id="client"
                      type="text"
                      value={client}
                      onChange={(e) => setClient(e.target.value)}
                      disabled={type === "expense"}
                      className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700">
                    Receipt <span className="text-zinc-400 font-normal">(optional, max 2MB)</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-3 border border-dashed border-zinc-300 rounded-lg cursor-pointer hover:border-zinc-500 hover:bg-zinc-50 transition-colors">
                    <Paperclip className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                    <span className="text-sm text-zinc-500">
                      {receiptImage ? "✔ File attached (click to replace)" : "Click to attach image"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {isSubmitting ? "Saving..." : "Update Transaction"}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard/transactions")}
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
