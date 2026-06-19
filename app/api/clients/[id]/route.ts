import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Client from "@/lib/models/Client";
import AuditLog from "@/lib/models/AuditLog";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const role = request.headers.get("x-user-role");
    if (role !== "admin" && role !== "viewer") {
      return NextResponse.json({ error: "Unauthorized. Admin or Viewer role required." }, { status: 403 });
    }

    const { id } = await params;
    const client = await Client.findById(id);
    if (!client) {
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    }

    return NextResponse.json(client);
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
    const { name, email, companyName, phone, website, status, notes, services, projectBudget } = body;

    const client = await Client.findById(id);
    if (!client) {
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    }

    // Check email uniqueness if email changed
    if (email && email.toLowerCase().trim() !== client.email) {
      const existing = await Client.findOne({ email: email.toLowerCase().trim() });
      if (existing) {
        return NextResponse.json({ error: "A client with this email already exists." }, { status: 400 });
      }
      client.email = email.toLowerCase().trim();
    }

    if (name) client.name = name.trim();
    if (companyName !== undefined) client.companyName = (companyName || "").trim();
    if (phone !== undefined) client.phone = (phone || "").trim();
    if (website !== undefined) client.website = (website || "").trim();
    if (status) client.status = status;
    if (notes !== undefined) client.notes = (notes || "").trim();
    if (services !== undefined) client.services = services;
    if (projectBudget !== undefined) client.projectBudget = Number(projectBudget) || 0;

    await client.save();

    await AuditLog.create({
      userEmail,
      userName,
      action: "Updated Client Profile",
      details: `Updated client profile for ${client.name} (${client.email}). Status: ${client.status}.`,
    });

    return NextResponse.json(client);
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
    const client = await Client.findById(id);
    if (!client) {
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    }

    await Client.findByIdAndDelete(id);

    await AuditLog.create({
      userEmail,
      userName,
      action: "Deleted Client Profile",
      details: `Deleted client profile of ${client.name} (${client.email}).`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
