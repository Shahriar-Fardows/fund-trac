import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Client from "@/lib/models/Client";
import AuditLog from "@/lib/models/AuditLog";

export async function GET(request: Request) {
  try {
    await dbConnect();
    const role = request.headers.get("x-user-role");
    if (role !== "admin" && role !== "viewer") {
      return NextResponse.json({ error: "Unauthorized. Admin or Viewer role required." }, { status: 403 });
    }

    const clients = await Client.find().sort({ createdAt: -1 });
    return NextResponse.json(clients);
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
    const { name, email, companyName, phone, website, status, notes, services, projectBudget } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
    }

    // Check if email already exists
    const existing = await Client.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json({ error: "A client with this email already exists." }, { status: 400 });
    }

    const client = await Client.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      companyName: (companyName || "").trim(),
      phone: (phone || "").trim(),
      website: (website || "").trim(),
      status: status || "lead",
      notes: (notes || "").trim(),
      services: services || [],
      projectBudget: Number(projectBudget) || 0,
      onboardedVia: "admin",
    });

    await AuditLog.create({
      userEmail,
      userName,
      action: "Created Client Profile",
      details: `Created client profile for ${client.name} (${client.email}) with status: ${client.status}.`,
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
