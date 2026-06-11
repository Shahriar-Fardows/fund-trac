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
