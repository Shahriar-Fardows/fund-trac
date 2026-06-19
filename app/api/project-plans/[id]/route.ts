import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ProjectPlan from "@/lib/models/ProjectPlan";
import AuditLog from "@/lib/models/AuditLog";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const role = request.headers.get("x-user-role");
    if (role !== "admin" && role !== "viewer") {
      return NextResponse.json({ error: "Unauthorized. Admin or Viewer role required." }, { status: 403 });
    }

    const { id } = await params;
    const plan = await ProjectPlan.findById(id);
    if (!plan) {
      return NextResponse.json({ error: "Project plan not found." }, { status: 404 });
    }

    return NextResponse.json(plan);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const role = request.headers.get("x-user-role");
    const userEmail = request.headers.get("x-user-email") || "unknown@teachfosys.com";
    const userName = request.headers.get("x-user-name") || "System User";

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, docLink } = body;

    const plan = await ProjectPlan.findById(id);
    if (!plan) {
      return NextResponse.json({ error: "Project plan not found." }, { status: 404 });
    }

    if (name) plan.name = name.trim();
    if (description) plan.description = description.trim();
    if (docLink) plan.docLink = docLink.trim();

    await plan.save();

    await AuditLog.create({
      userEmail,
      userName,
      action: "Updated Project Plan",
      details: `Updated project plan document "${plan.name}".`,
    });

    return NextResponse.json(plan);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const role = request.headers.get("x-user-role");
    const userEmail = request.headers.get("x-user-email") || "unknown@teachfosys.com";
    const userName = request.headers.get("x-user-name") || "System User";

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
    }

    const { id } = await params;
    const plan = await ProjectPlan.findById(id);
    if (!plan) {
      return NextResponse.json({ error: "Project plan not found." }, { status: 404 });
    }

    await ProjectPlan.findByIdAndDelete(id);

    await AuditLog.create({
      userEmail,
      userName,
      action: "Deleted Project Plan",
      details: `Deleted project plan document "${plan.name}".`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
