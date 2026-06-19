import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Contribution from "@/lib/models/Contribution";
import AuditLog from "@/lib/models/AuditLog";

export async function PUT(
  request: Request,
  { params }: { params: Promise<any> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const role = request.headers.get("x-user-role");
    const userEmail = request.headers.get("x-user-email") || "unknown@teachfosys.com";
    const userName = request.headers.get("x-user-name") || "System User";

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
    }

    const { partnerName, amount, date, note } = await request.json();
    if (!partnerName || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const oldContribution = await Contribution.findById(id);
    if (!oldContribution) {
      return NextResponse.json({ error: "Contribution not found" }, { status: 404 });
    }

    const contribution = await Contribution.findByIdAndUpdate(
      id,
      {
        partnerName,
        amount: Number(amount),
        date: date ? new Date(date) : oldContribution.date,
        note,
      },
      { new: true }
    );

    // Create Audit Log
    await AuditLog.create({
      userEmail,
      userName,
      action: "Edited Contribution",
      details: `Edited contribution ID ${id}: Changed from ${oldContribution.partnerName} (${oldContribution.amount} BDT) to ${partnerName} (${amount} BDT).`,
    });

    return NextResponse.json(contribution);
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
    const userEmail = request.headers.get("x-user-email") || "unknown@teachfosys.com";
    const userName = request.headers.get("x-user-name") || "System User";

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
    }

    const contribution = await Contribution.findById(id);
    if (!contribution) {
      return NextResponse.json({ error: "Contribution not found" }, { status: 404 });
    }

    await Contribution.findByIdAndDelete(id);

    // Create Audit Log
    await AuditLog.create({
      userEmail,
      userName,
      action: "Deleted Record",
      details: `Deleted contribution of ${contribution.amount} BDT from partner ${contribution.partnerName}.`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
