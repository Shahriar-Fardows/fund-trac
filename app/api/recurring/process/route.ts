import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import RecurringTransaction from "@/lib/models/RecurringTransaction";
import Transaction from "@/lib/models/Transaction";
import AuditLog from "@/lib/models/AuditLog";

// Helper: compute next run date based on frequency
function computeNextRunDate(from: Date, frequency: string): Date {
  const next = new Date(from);
  switch (frequency) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

export async function POST() {
  try {
    await dbConnect();
    const now = new Date();

    // Find all active recurring transactions where nextRunDate <= now
    const dueItems = await RecurringTransaction.find({
      active: true,
      nextRunDate: { $lte: now },
    });

    let processed = 0;

    for (const r of dueItems) {
      // Create actual transaction record
      await Transaction.create({
        type: r.type,
        amount: r.amount,
        category: r.category,
        description: `[Auto] ${r.description}`,
        date: r.nextRunDate,
        project: r.project || "",
        client: r.client || "",
        createdBy: r.createdBy,
      });

      // Update nextRunDate for the recurring entry
      const newNextRun = computeNextRunDate(r.nextRunDate, r.frequency);
      await RecurringTransaction.findByIdAndUpdate(r._id, {
        lastRun: r.nextRunDate,
        nextRunDate: newNextRun,
      });

      await AuditLog.create({
        userEmail: r.createdBy || "system",
        userName: "System (Auto)",
        action: "Auto Transaction Created",
        details: `Auto-created recurring ${r.type} of ${r.amount.toLocaleString()} BDT — "${r.description}".`,
      });

      processed++;
    }

    return NextResponse.json({ processed, message: `${processed} recurring transaction(s) processed.` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
