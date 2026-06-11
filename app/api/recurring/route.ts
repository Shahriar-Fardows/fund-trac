import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import RecurringTransaction from "@/lib/models/RecurringTransaction";
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

export async function GET(request: Request) {
  try {
    await dbConnect();
    const recurring = await RecurringTransaction.find({}).sort({ createdAt: -1 });
    return NextResponse.json(recurring);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();

    const role = request.headers.get("x-user-role");
    const userEmail = request.headers.get("x-user-email") || "";
    const userName = request.headers.get("x-user-name") || "";

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    }

    const { type, amount, category, description, project, client, frequency, startDate } =
      await request.json();

    if (!type || !amount || !category || !description || !frequency || !startDate) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    const start = new Date(startDate);
    const nextRunDate = computeNextRunDate(start, frequency);

    const recurring = await RecurringTransaction.create({
      type,
      amount: Number(amount),
      category,
      description,
      project,
      client: type === "income" ? client : "",
      frequency,
      startDate: start,
      nextRunDate,
      createdBy: userEmail,
    });

    await AuditLog.create({
      userEmail,
      userName,
      action: "Added Recurring Transaction",
      details: `Set up recurring ${type} of ${Number(amount).toLocaleString()} BDT — "${description}" every ${frequency}.`,
    });

    return NextResponse.json(recurring, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
