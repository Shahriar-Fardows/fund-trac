import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Contribution from "@/lib/models/Contribution";
import AuditLog from "@/lib/models/AuditLog";

export async function GET() {
  try {
    await dbConnect();
    const contributions = await Contribution.find({}).sort({ date: -1 });
    return NextResponse.json(contributions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const role = request.headers.get("x-user-role");
    const userEmail = request.headers.get("x-user-email") || "unknown@shahriar.com";
    const userName = request.headers.get("x-user-name") || "System User";

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
    }

    const { partnerName, amount, date, note } = await request.json();
    if (!partnerName || !amount) {
      return NextResponse.json({ error: "Missing required fields: partnerName, amount" }, { status: 400 });
    }

    const contribution = await Contribution.create({
      partnerName,
      amount: Number(amount),
      date: date ? new Date(date) : new Date(),
      note,
    });

    // Create Audit Log
    await AuditLog.create({
      userEmail,
      userName,
      action: "Added Contribution",
      details: `Added contribution of ${Number(amount).toLocaleString()} BDT from partner ${partnerName}.`,
    });

    return NextResponse.json(contribution, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
