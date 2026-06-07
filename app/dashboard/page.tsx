"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/app/context/UserContext";
import Sidebar from "@/app/components/Sidebar";
import Navbar from "@/app/components/Navbar";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Coins,
  ChevronRight,
  ShieldAlert,
  FolderLock,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  Users,
  Award,
} from "lucide-react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";

interface StatsData {
  summary: {
    totalContributions: number;
    totalIncome: number;
    totalExpense: number;
    currentBalance: number;
    thisMonthIncome: number;
    thisMonthExpense: number;
  };
  leaderboard: Array<{ name: string; amount: number; percentage: number }>;
  topExpenses: Array<{ category: string; amount: number }>;
  cashFlow: Array<{ month: string; income: number; expense: number }>;
  clientRevenue: Array<{ client: string; amount: number }>;
  projectProfitLoss: Array<{ project: string; income: number; expense: number; net: number }>;
  alerts: Array<{ type: string; title: string; message: string }>;
  recentTransactions: Array<{
    _id: string;
    type: "income" | "expense";
    amount: number;
    category: string;
    description: string;
    date: string;
    project?: string;
  }>;
}

export default function DashboardPage() {
  const { user, selectedMonth, loading: userLoading } = useUser();
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/dashboard/stats?month=${selectedMonth}`);
      if (res.ok) {
        const stats = await res.json();
        setData(stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMonth) {
      fetchStats();
    }
  }, [selectedMonth]);

  if (userLoading || loading || !data) {
    return (
      <div className="flex h-screen bg-zinc-50">
        <Sidebar />
        <div className="flex-1 flex flex-col pl-64">
          <Navbar />
          <div className="flex-grow flex items-center justify-center pt-16">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-zinc-200 border-t-zinc-950 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-zinc-500 font-medium">Loading Financial Intelligence...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Format currencies
  const formatBDT = (val: number) => `${val.toLocaleString()} BDT`;

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar />
      <div className="flex-grow pl-64 flex flex-col">
        <Navbar />

        {/* Dashboard Main Content */}
        <main className="flex-grow pt-20 px-8 pb-8 space-y-6 overflow-y-auto">
          
          {/* Welcome and Alert Banner */}
          {data.alerts.length > 0 && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-start gap-4">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
              <div>
                <span className="font-bold text-sm">Action Required</span>
                <ul className="text-xs space-y-1 mt-1 list-disc pl-4">
                  {data.alerts.map((alert, i) => (
                    <li key={i}>{alert.message}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1: Available Balance */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-zinc-500 uppercase">Available Balance</span>
                <h3 className="text-2xl font-bold text-zinc-900">{formatBDT(data.summary.currentBalance)}</h3>
                <span className="text-[10px] text-zinc-400 block font-medium">Updated live</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-md">
                <Wallet className="w-6 h-6" />
              </div>
            </div>

            {/* Card 2: Income This Month */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-zinc-500 uppercase">Income This Month</span>
                <h3 className="text-2xl font-bold text-emerald-650">{formatBDT(data.summary.thisMonthIncome)}</h3>
                <span className="text-[10px] text-zinc-400 block font-medium">All revenue streams</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shadow-sm">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            {/* Card 3: Expense This Month */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-zinc-500 uppercase">Expense This Month</span>
                <h3 className="text-2xl font-bold text-red-650">{formatBDT(data.summary.thisMonthExpense)}</h3>
                <span className="text-[10px] text-zinc-400 block font-medium">Operating expenses</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-700 flex items-center justify-center border border-red-100 shadow-sm">
                <TrendingDown className="w-6 h-6" />
              </div>
            </div>

            {/* Card 4: Capital Contributions */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-zinc-500 uppercase">Total Partner Fund</span>
                <h3 className="text-2xl font-bold text-blue-650">{formatBDT(data.summary.totalContributions)}</h3>
                <span className="text-[10px] text-zinc-400 block font-medium">Original invested capital</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100 shadow-sm">
                <Coins className="w-6 h-6" />
              </div>
            </div>

          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Cash Flow Area Chart */}
            <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <h4 className="font-bold text-zinc-900">Cash Flow History</h4>
                <p className="text-xs text-zinc-500">6-Month tracking of Income vs Expenses</p>
              </div>
              <div className="h-72">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.cashFlow} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                      <XAxis dataKey="month" stroke="#71717a" fontSize={11} tickLine={false} />
                      <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                      <Area type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Top Expense Categories */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-zinc-900">Top Expense Categories</h4>
                  <p className="text-xs text-zinc-500">Distribution of spending</p>
                </div>
                {data.topExpenses.length === 0 ? (
                  <div className="text-center py-12 text-zinc-400 text-sm">
                    No expense records found.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.topExpenses.slice(0, 5).map((exp, idx) => {
                      const totalExpSum = data.topExpenses.reduce((sum, item) => sum + item.amount, 0);
                      const percentage = totalExpSum > 0 ? (exp.amount / totalExpSum) * 100 : 0;
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-semibold text-zinc-700">
                            <span>{exp.category}</span>
                            <span>{formatBDT(exp.amount)}</span>
                          </div>
                          <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-zinc-900 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <Link
                href="/dashboard/transactions"
                className="mt-6 flex items-center justify-center gap-1.5 w-full py-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-semibold rounded-lg transition-colors"
              >
                <span>View Full Ledger</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

          </div>

          {/* Lower Rows: Ownership and Project Profitability */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Investor Contributions & Ownership */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-zinc-900">Equity & Ownership</h4>
                  <p className="text-xs text-zinc-500">Partner contribution percentages</p>
                </div>
                <Users className="w-5 h-5 text-zinc-400" />
              </div>
              
              <div className="divide-y divide-zinc-100">
                {data.leaderboard.map((partner, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700 font-bold text-sm">
                        {idx + 1}
                      </div>
                      <div>
                        <span className="block text-sm font-semibold text-zinc-900">{partner.name}</span>
                        <span className="block text-[10px] text-zinc-400">Contributor</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-sm font-bold text-zinc-900">{formatBDT(partner.amount)}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-650 bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded-full">
                        <Award className="w-3 h-3 text-zinc-500" />
                        {partner.percentage.toFixed(1)}% Share
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Project Profit / Loss Tracker */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-zinc-900">Project profitability</h4>
                  <p className="text-xs text-zinc-500">Studio finance summary per project</p>
                </div>
                <Briefcase className="w-5 h-5 text-zinc-400" />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 font-semibold text-zinc-500 uppercase">
                      <th className="pb-3">Project</th>
                      <th className="pb-3 text-right">Revenue</th>
                      <th className="pb-3 text-right">Expense</th>
                      <th className="pb-3 text-right">Net Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-zinc-800">
                    {data.projectProfitLoss.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-zinc-400">
                          No project transactions recorded.
                        </td>
                      </tr>
                    ) : (
                      data.projectProfitLoss.map((p, idx) => (
                        <tr key={idx} className="hover:bg-zinc-55">
                          <td className="py-3 font-semibold text-zinc-900">{p.project}</td>
                          <td className="py-3 text-right text-emerald-650 font-medium">+{p.income.toLocaleString()}</td>
                          <td className="py-3 text-right text-red-650">-{p.expense.toLocaleString()}</td>
                          <td className={`py-3 text-right font-bold ${p.net >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                            {p.net >= 0 ? "+" : ""}{p.net.toLocaleString()} BDT
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Recent Ledger Entries */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-zinc-900">Recent Transactions</h4>
                <p className="text-xs text-zinc-500">Latest active records on ledger</p>
              </div>
              <Link
                href="/dashboard/transactions"
                className="text-xs font-semibold text-zinc-950 hover:underline flex items-center gap-1"
              >
                <span>View ledger</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="divide-y divide-zinc-150">
              {data.recentTransactions.map((t) => (
                <div key={t._id} className="py-3.5 flex items-center justify-between hover:bg-zinc-50 transition-colors rounded-lg px-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      t.type === "income"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        : "bg-red-50 text-red-700 border border-red-100"
                    }`}>
                      {t.type === "income" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="block text-sm font-semibold text-zinc-900">{t.description}</span>
                      <span className="block text-[10px] text-zinc-400">
                        {t.category} • {new Date(t.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`block text-sm font-bold ${
                      t.type === "income" ? "text-emerald-700" : "text-red-700"
                    }`}>
                      {t.type === "income" ? "+" : "-"}{t.amount.toLocaleString()} BDT
                    </span>
                    {t.project && (
                      <span className="text-[10px] bg-zinc-100 text-zinc-650 px-2 py-0.5 rounded-md font-semibold">
                        {t.project}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
