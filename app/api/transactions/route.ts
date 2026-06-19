import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Transaction from "@/lib/models/Transaction";
import AuditLog from "@/lib/models/AuditLog";

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type"); // 'income' or 'expense'
    const category = searchParams.get("category");
    const project = searchParams.get("project");
    const search = searchParams.get("search"); // description or client search
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build query filter
    const filter: any = {};

    if (type) {
      filter.type = type;
    }
    if (category) {
      filter.category = category;
    }
    if (project) {
      filter.project = project;
    }
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: "i" } },
        { client: { $regex: search, $options: "i" } },
      ];
    }
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.date.$lte = new Date(endDate);
      }
    }

    const transactions = await Transaction.find(filter).sort({ date: -1 });
    return NextResponse.json(transactions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const role = request.headers.get("x-user-role");
    const userEmail = request.headers.get("x-user-email") || "unknown@teachfosys.com";
    const userName = request.headers.get("x-user-name") || "System User";

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
    }

    const { type, amount, category, description, date, receiptImage, client, project, status, receivedAmount } = await request.json();

    if (!type || !amount || !category || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const numericAmount = Number(amount);
    let resolvedStatus = status || "completed";
    let resolvedReceivedAmount = Number(receivedAmount) || 0;

    if (resolvedStatus === "completed") {
      resolvedReceivedAmount = numericAmount;
    } else if (resolvedStatus === "pending") {
      resolvedReceivedAmount = 0;
    } else if (resolvedStatus === "partial") {
      if (resolvedReceivedAmount >= numericAmount) {
        resolvedStatus = "completed";
        resolvedReceivedAmount = numericAmount;
      }
    }

    const transaction = await Transaction.create({
      type,
      amount: numericAmount,
      category,
      description,
      date: date ? new Date(date) : new Date(),
      receiptImage,
      client,
      project,
      status: resolvedStatus,
      receivedAmount: resolvedReceivedAmount,
    });

    // Create Audit Log
    const displayType = type === "income" ? "Income" : "Expense";
    await AuditLog.create({
      userEmail,
      userName,
      action: `Added ${displayType}`,
      details: `Added ${type} of ${Number(amount).toLocaleString()} BDT under category "${category}" (${description}).`,
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
