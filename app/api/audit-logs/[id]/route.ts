import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import AuditLog from "@/lib/models/AuditLog";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const role = request.headers.get("x-user-role");
    const userEmail = request.headers.get("x-user-email");

    if (role !== "admin" || userEmail !== "shahriar@teachfosys.com") {
      return NextResponse.json(
        { error: "Unauthorized. Only shahriar@teachfosys.com can delete audit logs." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const deletedLog = await AuditLog.findByIdAndDelete(id);
    if (!deletedLog) {
      return NextResponse.json({ error: "Audit log entry not found." }, { status: 404 });
    }

    // Log the deletion action to the audit trail
    await AuditLog.create({
      userEmail,
      userName: "System Administrator",
      action: "Deleted Audit Log",
      details: `Audit log entry with ID ${id} was deleted.`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
