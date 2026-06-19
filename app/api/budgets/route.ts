import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Budget from "@/lib/models/Budget";
import AuditLog from "@/lib/models/AuditLog";

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");

    const query: any = {};
    if (month) {
      query.month = month;
    }

    const budgets = await Budget.find(query);
    return NextResponse.json(budgets);
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

    const { month, category, limit } = await request.json();

    if (!month || !category || limit === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Upsert the budget based on month and category
    const budget = await Budget.findOneAndUpdate(
      { month, category },
      { limit: Number(limit) },
      { new: true, upsert: true }
    );

    // Create Audit Log
    await AuditLog.create({
      userEmail,
      userName,
      action: "Edited Transaction", // Matching requested audit actions ("Added Income", "Added Expense", "Edited Transaction", "Deleted Record", etc. Let's use Edited Transaction or specific detail)
      details: `Configured budget for "${category}" in ${month}: Set limit to ${Number(limit).toLocaleString()} BDT.`,
    });

    return NextResponse.json(budget);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
