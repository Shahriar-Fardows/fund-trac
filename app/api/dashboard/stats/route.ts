import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Contribution from "@/lib/models/Contribution";
import Transaction from "@/lib/models/Transaction";
import Budget from "@/lib/models/Budget";
import AuditLog from "@/lib/models/AuditLog";

export async function GET(request: Request) {
  try {
    await dbConnect();
    
    // Parse query params for specific month if needed, default to current month
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month") || new Date().toISOString().substring(0, 7); // e.g. "2026-06"

    // Fetch all datasets
    const [contributions, transactions, budgets, auditLogs] = await Promise.all([
      Contribution.find({}),
      Transaction.find({}),
      Budget.find({ month }),
      AuditLog.find({}).sort({ timestamp: -1 }).limit(10),
    ]);

    // 1. Contributions Summary
    const totalContributions = contributions.reduce((acc, c) => acc + c.amount, 0);

    // 2. Income vs Expenses
    let totalIncome = 0;
    let totalExpense = 0;
    
    transactions.forEach((t) => {
      if (t.type === "income") {
        totalIncome += t.receivedAmount !== undefined ? t.receivedAmount : t.amount;
      } else if (t.type === "expense") {
        totalExpense += t.amount;
      }
    });

    // 3. Balances
    const currentBalance = totalContributions + totalIncome - totalExpense;

    // 4. Contribution Leaderboard (Percentage ownership)
    const partnerTotals: Record<string, number> = {};
    contributions.forEach((c) => {
      partnerTotals[c.partnerName] = (partnerTotals[c.partnerName] || 0) + c.amount;
    });

    const leaderboard = Object.keys(partnerTotals).map((name) => ({
      name,
      amount: partnerTotals[name],
      percentage: totalContributions > 0 ? (partnerTotals[name] / totalContributions) * 100 : 0,
    })).sort((a, b) => b.amount - a.amount);

    // 5. This Month Income vs Expense
    let thisMonthIncome = 0;
    let thisMonthExpense = 0;

    transactions.forEach((t) => {
      const tMonth = new Date(t.date).toISOString().substring(0, 7);
      if (tMonth === month) {
        if (t.type === "income") {
          thisMonthIncome += t.receivedAmount !== undefined ? t.receivedAmount : t.amount;
        } else if (t.type === "expense") {
          thisMonthExpense += t.amount;
        }
      }
    });

    // 6. Category Breakdown
    const expenseByCategory: Record<string, number> = {};
    const incomeByCategory: Record<string, number> = {};
    const clientRevenue: Record<string, number> = {};
    const projectProfitLoss: Record<string, { income: number; expense: number; net: number }> = {};

    transactions.forEach((t) => {
      if (t.type === "expense") {
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
      } else {
        const received = t.receivedAmount !== undefined ? t.receivedAmount : t.amount;
        incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + received;
      }

      if (t.client) {
        const val = t.type === "income" ? (t.receivedAmount !== undefined ? t.receivedAmount : t.amount) : t.amount;
        clientRevenue[t.client] = (clientRevenue[t.client] || 0) + val;
      }

      if (t.project) {
        if (!projectProfitLoss[t.project]) {
          projectProfitLoss[t.project] = { income: 0, expense: 0, net: 0 };
        }
        if (t.type === "income") {
          const received = t.receivedAmount !== undefined ? t.receivedAmount : t.amount;
          projectProfitLoss[t.project].income += received;
        } else {
          projectProfitLoss[t.project].expense += t.amount;
        }
        projectProfitLoss[t.project].net = projectProfitLoss[t.project].income - projectProfitLoss[t.project].expense;
      }
    });

    const topExpenses = Object.keys(expenseByCategory).map((cat) => ({
      category: cat,
      amount: expenseByCategory[cat],
    })).sort((a, b) => b.amount - a.amount);

    // 7. Cash Flow Graph (Grouped by month, past 6 months)
    const monthlyData: Record<string, { month: string; income: number; expense: number }> = {};
    // Seed past 6 months to make sure they appear
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mStr = d.toISOString().substring(0, 7);
      monthlyData[mStr] = { month: mStr, income: 0, expense: 0 };
    }

    transactions.forEach((t) => {
      const tMonth = new Date(t.date).toISOString().substring(0, 7);
      if (monthlyData[tMonth]) {
        if (t.type === "income") {
          monthlyData[tMonth].income += t.receivedAmount !== undefined ? t.receivedAmount : t.amount;
        } else if (t.type === "expense") {
          monthlyData[tMonth].expense += t.amount;
        }
      }
    });

    const cashFlow = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));

    // 8. Alerts & Warnings
    const alerts: Array<{ type: "warning" | "danger" | "info"; title: string; message: string }> = [];

    // Budget exceeded alert
    // Get actual expense per category for the specified month
    const thisMonthExpensesByCategory: Record<string, number> = {};
    transactions.forEach((t) => {
      const tMonth = new Date(t.date).toISOString().substring(0, 7);
      if (tMonth === month && t.type === "expense") {
        thisMonthExpensesByCategory[t.category] = (thisMonthExpensesByCategory[t.category] || 0) + t.amount;
      }
    });

    budgets.forEach((b) => {
      const actual = thisMonthExpensesByCategory[b.category] || 0;
      if (actual > b.limit) {
        alerts.push({
          type: "warning",
          title: "Over Budget Warning",
          message: `Category "${b.category}" has spent ${actual.toLocaleString()} BDT, exceeding its budget limit of ${b.limit.toLocaleString()} BDT by ${(actual - b.limit).toLocaleString()} BDT.`,
        });
      }
    });

    // Upcoming subscriptions alert (mock items for demo or actual categories)
    // Find Software Subscription and Server / Hosting expenses and list them as upcoming renewals
    const hostingExpenses = transactions.filter(t => t.category === "Server / Hosting" || t.category === "Software Subscription");
    if (hostingExpenses.length > 0) {
      const latestRenewal = hostingExpenses[0]; // or sort to find newest
      alerts.push({
        type: "info",
        title: "Upcoming Subscription Renewal",
        message: `Recurring payment for VPS/Hosting or Software Subscription is approaching within the next week.`,
      });
    }

    return NextResponse.json({
      summary: {
        totalContributions,
        totalIncome,
        totalExpense,
        currentBalance,
        thisMonthIncome,
        thisMonthExpense,
      },
      leaderboard,
      topExpenses,
      cashFlow,
      clientRevenue: Object.keys(clientRevenue).map(client => ({ client, amount: clientRevenue[client] })),
      projectProfitLoss: Object.keys(projectProfitLoss).map(project => ({
        project,
        ...projectProfitLoss[project]
      })),
      alerts,
      recentTransactions: transactions.slice(-5).reverse(),
      recentAuditLogs: auditLogs,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
