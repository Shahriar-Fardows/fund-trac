import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import RecurringTransaction from "@/lib/models/RecurringTransaction";
import AuditLog from "@/lib/models/AuditLog";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<any> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const role = request.headers.get("x-user-role");
    const userEmail = request.headers.get("x-user-email") || "";
    const userName = request.headers.get("x-user-name") || "";

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    }

    const r = await RecurringTransaction.findById(id);
    if (!r) {
      return NextResponse.json({ error: "Recurring transaction not found." }, { status: 404 });
    }

    await RecurringTransaction.findByIdAndDelete(id);

    await AuditLog.create({
      userEmail,
      userName,
      action: "Deleted Record",
      details: `Deleted recurring ${r.type} transaction — "${r.description}" (${r.frequency}).`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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

export async function PUT(
  request: Request,
  { params }: { params: Promise<any> }
) {
  try {
    await dbConnect();
    const { id } = await params;

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

    const r = await RecurringTransaction.findById(id);
    if (!r) {
      return NextResponse.json({ error: "Recurring transaction not found." }, { status: 404 });
    }

    const start = new Date(startDate);
    const oldStart = new Date(r.startDate);

    // Compute nextRunDate if startDate or frequency changed
    let nextRunDate = r.nextRunDate;
    if (start.getTime() !== oldStart.getTime() || frequency !== r.frequency) {
      nextRunDate = computeNextRunDate(start, frequency);
    }

    r.type = type;
    r.amount = Number(amount);
    r.category = category;
    r.description = description;
    r.project = project || "";
    r.client = type === "income" ? (client || "") : "";
    r.frequency = frequency;
    r.startDate = start;
    r.nextRunDate = nextRunDate;

    await r.save();

    await AuditLog.create({
      userEmail,
      userName,
      action: "Updated Record",
      details: `Updated recurring transaction — "${description}" (${frequency}).`,
    });

    return NextResponse.json(r);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

