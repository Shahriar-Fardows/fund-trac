import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ProjectPlan from "@/lib/models/ProjectPlan";
import AuditLog from "@/lib/models/AuditLog";

export async function GET(request: Request) {
  try {
    await dbConnect();
    const role = request.headers.get("x-user-role");
    if (role !== "admin" && role !== "viewer") {
      return NextResponse.json({ error: "Unauthorized. Admin or Viewer role required." }, { status: 403 });
    }

    const plans = await ProjectPlan.find().sort({ createdAt: -1 });
    return NextResponse.json(plans);
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

    const body = await request.json();
    const { name, description, docLink } = body;

    if (!name || !description || !docLink) {
      return NextResponse.json({ error: "Name, description, and document link are required." }, { status: 400 });
    }

    const plan = await ProjectPlan.create({
      name: name.trim(),
      description: description.trim(),
      docLink: docLink.trim(),
    });

    await AuditLog.create({
      userEmail,
      userName,
      action: "Created Project Plan",
      details: `Created project plan document "${plan.name}" with link: ${plan.docLink}.`,
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
