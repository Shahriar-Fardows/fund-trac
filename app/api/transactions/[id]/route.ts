import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Transaction from "@/lib/models/Transaction";
import AuditLog from "@/lib/models/AuditLog";

export async function PUT(
  request: Request,
  { params }: { params: Promise<any> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const role = request.headers.get("x-user-role");
    const userEmail = request.headers.get("x-user-email") || "unknown@fundtrac.com";
    const userName = request.headers.get("x-user-name") || "System User";

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
    }

    const { type, amount, category, description, date, receiptImage, client, project } = await request.json();

    if (!type || !amount || !category || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const oldTransaction = await Transaction.findById(id);
    if (!oldTransaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const transaction = await Transaction.findByIdAndUpdate(
      id,
      {
        type,
        amount: Number(amount),
        category,
        description,
        date: date ? new Date(date) : oldTransaction.date,
        receiptImage,
        client,
        project,
      },
      { new: true }
    );

    // Create Audit Log
    await AuditLog.create({
      userEmail,
      userName,
      action: "Edited Transaction",
      details: `Edited transaction ID ${id}: Changed from ${oldTransaction.type} (${oldTransaction.amount} BDT) to ${type} (${amount} BDT).`,
    });

    return NextResponse.json(transaction);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<any> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const role = request.headers.get("x-user-role");
    const userEmail = request.headers.get("x-user-email") || "unknown@fundtrac.com";
    const userName = request.headers.get("x-user-name") || "System User";

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
    }

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    await Transaction.findByIdAndDelete(id);

    // Create Audit Log
    const displayType = transaction.type === "income" ? "Income" : "Expense";
    await AuditLog.create({
      userEmail,
      userName,
      action: "Deleted Record",
      details: `Deleted ${displayType} of ${transaction.amount} BDT under category "${transaction.category}" (${transaction.description}).`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
