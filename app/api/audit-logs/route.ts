import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import AuditLog from "@/lib/models/AuditLog";

export async function GET() {
  try {
    await dbConnect();
    const logs = await AuditLog.find({}).sort({ timestamp: -1 });
    return NextResponse.json(logs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await dbConnect();
    const role = request.headers.get("x-user-role");
    const userEmail = request.headers.get("x-user-email");

    if (role !== "admin" || userEmail !== "shahriar@shahriar.com") {
      return NextResponse.json(
        { error: "Unauthorized. Only shahriar@shahriar.com can delete audit logs." },
        { status: 403 }
      );
    }

    const { ids } = await request.json();
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Invalid request. 'ids' must be a non-empty array." }, { status: 400 });
    }

    const deleteResult = await AuditLog.deleteMany({ _id: { $in: ids } });

    // Log the bulk deletion action to the audit trail
    await AuditLog.create({
      userEmail,
      userName: "System Administrator",
      action: "Bulk Deleted Audit Logs",
      details: `Bulk deleted ${deleteResult.deletedCount} audit log entries.`,
    });

    return NextResponse.json({ success: true, count: deleteResult.deletedCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

