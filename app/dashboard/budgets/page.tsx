"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/app/context/UserContext";
import Sidebar from "@/app/components/Sidebar";
import Navbar from "@/app/components/Navbar";
import {
  TrendingDown,
  Plus,
  X,
  Check,
  Calendar,
  DollarSign,
  Tag,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

interface Budget {
  _id?: string;
  month: string;
  category: string;
  limit: number;
}

interface StatsData {
  topExpenses: Array<{ category: string; amount: number }>;
}

export default function BudgetsPage() {
  const { user, selectedMonth } = useUser();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState("Server / Hosting");
  const [limit, setLimit] = useState("");
  const [error, setError] = useState("");

  const categories = [
    "Server / Hosting",
    "Domain",
    "Software Subscription",
    "Marketing",
    "Salary",
    "Office Expense",
    "Miscellaneous",
  ];

  const fetchData = async () => {
    if (!selectedMonth) return;
    try {
      setLoading(true);
      const [budgetsRes, statsRes] = await Promise.all([
        fetch(`/api/budgets?month=${selectedMonth}`),
        fetch(`/api/dashboard/stats?month=${selectedMonth}`),
      ]);

      if (budgetsRes.ok && statsRes.ok) {
        const budgetsData = await budgetsRes.json();
        const statsData = await statsRes.json();
        setBudgets(budgetsData);
        setStats(statsData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const handleOpenAddModal = () => {
    setCategory("Server / Hosting");
    setLimit("");
    setError("");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!limit) {
      setError("Please specify a budget limit amount.");
      return;
    }

    const payload = {
      month: selectedMonth,
      category,
      limit: Number(limit),
    };

    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user?.role || "",
          "x-user-email": user?.email || "",
          "x-user-name": user?.name || "",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Operation failed");
      }

      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Compile calculations for budget items
  const getBudgetDetails = () => {
    const expensesMap: Record<string, number> = {};
    if (stats) {
      stats.topExpenses.forEach((e) => {
        expensesMap[e.category] = e.amount;
      });
    }

    return categories.map((cat) => {
      const budgetObj = budgets.find((b) => b.category === cat);
      const limitVal = budgetObj ? budgetObj.limit : 0;
      const actualVal = expensesMap[cat] || 0;
      const remaining = limitVal > 0 ? limitVal - actualVal : -actualVal;
      const percent = limitVal > 0 ? (actualVal / limitVal) * 100 : 0;

      return {
        category: cat,
        limit: limitVal,
        actual: actualVal,
        remaining,
        percent,
        hasBudget: !!budgetObj,
      };
    });
  };

  const budgetDetails = getBudgetDetails();
  const totalBudgeted = budgetDetails.reduce((sum, item) => sum + item.limit, 0);
  const totalActualSpent = budgetDetails.reduce((sum, item) => sum + item.actual, 0);
  const totalRemaining = totalBudgeted - totalActualSpent;

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar />
      <div className="flex-grow pl-64 flex flex-col">
        <Navbar />

        <main className="flex-grow pt-20 px-8 pb-8 space-y-6 overflow-y-auto">
          
          {/* Header Action */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 font-medium">
                Set and compare spending limits for the month: <span className="font-semibold text-zinc-900">{selectedMonth}</span>
              </p>
            </div>
            {user?.role === "admin" && (
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Configure Budget</span>
              </button>
            )}
          </div>

          {/* Budget Overview Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Total Budget limit */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-zinc-500 uppercase">Total Monthly Budget</span>
              <h3 className="text-2xl font-bold text-zinc-900">{totalBudgeted.toLocaleString()} BDT</h3>
              <span className="text-[10px] text-zinc-400 font-medium block">Total configuration for {selectedMonth}</span>
            </div>

            {/* Total Spent */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-zinc-500 uppercase">Total Spending</span>
              <h3 className="text-2xl font-bold text-zinc-900">{totalActualSpent.toLocaleString()} BDT</h3>
              <span className="text-[10px] text-zinc-400 font-medium block">
                {totalBudgeted > 0 ? `${((totalActualSpent / totalBudgeted) * 100).toFixed(0)}% of total budget` : "No budget configured"}
              </span>
            </div>

            {/* Remaining Budget */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-zinc-500 uppercase">Remaining Balance</span>
              <h3 className={`text-2xl font-bold ${totalRemaining >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                {totalRemaining.toLocaleString()} BDT
              </h3>
              <span className="text-[10px] text-zinc-400 font-medium block">
                {totalRemaining >= 0 ? "Safely under limit" : "Over budget deficit"}
              </span>
            </div>

          </div>

          {/* Budgets Progress Grid */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="font-bold text-sm text-zinc-900 uppercase tracking-tight">Category Spending Status</h4>
            
            {loading ? (
              <div className="py-12 text-center text-zinc-500 text-sm">
                Compiling budget data...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {budgetDetails.map((item, idx) => {
                  const isOver = item.actual > item.limit && item.limit > 0;
                  const isNotSet = item.limit === 0;
                  return (
                    <div key={idx} className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/50 space-y-3">
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-sm text-zinc-900">{item.category}</span>
                          <span className="block text-[10px] text-zinc-400">
                            {isNotSet ? "No budget limit configured" : `Limit: ${item.limit.toLocaleString()} BDT`}
                          </span>
                        </div>
                        {isOver && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Over Budget
                          </span>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="h-3 w-full bg-zinc-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isOver ? "bg-red-500" : "bg-zinc-900"
                            }`}
                            style={{ width: `${Math.min(item.percent, 100)}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-zinc-500 font-semibold">
                          <span>Spent: {item.actual.toLocaleString()} BDT</span>
                          <span>{item.percent.toFixed(0)}%</span>
                        </div>
                      </div>

                      {/* Deficit / Surplus info */}
                      <div className="flex items-center justify-between text-[10px] border-t border-zinc-100 pt-2 font-medium">
                        <span className="text-zinc-400">Remaining</span>
                        <span
                          className={`font-bold ${
                            item.remaining >= 0 ? "text-emerald-700" : "text-red-700"
                          }`}
                        >
                          {item.remaining >= 0 ? `+${item.remaining.toLocaleString()}` : item.remaining.toLocaleString()} BDT
                        </span>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </main>
      </div>

      {/* Configure Budget Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-zinc-150 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
              <h3 className="font-bold text-zinc-900">Configure Monthly Budget</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-zinc-50 text-zinc-400 hover:text-zinc-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-semibold">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-650 uppercase">Target Month</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <input
                    type="month"
                    disabled
                    value={selectedMonth}
                    className="w-full pl-9 pr-4 py-2 border border-zinc-250 bg-zinc-50 rounded-lg text-zinc-500 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-650 uppercase">Category</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                    <Tag className="w-4 h-4" />
                  </span>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-zinc-250 bg-white rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-650 uppercase">Monthly Limit (BDT)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                    <DollarSign className="w-4 h-4" />
                  </span>
                  <input
                    type="number"
                    required
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    placeholder="Limit in BDT"
                    className="w-full pl-9 pr-4 py-2 border border-zinc-250 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Configuration</span>
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
