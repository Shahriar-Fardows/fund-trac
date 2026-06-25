import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Client from "@/lib/models/Client";
import AuditLog from "@/lib/models/AuditLog";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { name, email, companyName, phone, website, services, projectBudget, notes } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Full Name and Contact Email are required." }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existing = await Client.findOne({ email: cleanEmail });
    if (existing) {
      return NextResponse.json({
        error: "This email is already registered. If you wish to update your details or check your status, please contact support at info@shahriar.com."
      }, { status: 400 });
    }

    const servicesArray = typeof services === "string"
      ? services.split(",").map((s: string) => s.trim()).filter(Boolean)
      : services || [];

    const client = await Client.create({
      name: name.trim(),
      email: cleanEmail,
      companyName: (companyName || "").trim(),
      phone: (phone || "").trim(),
      website: (website || "").trim(),
      status: "pending", // onboarding client defaults to pending approval
      notes: (notes || "").trim(),
      services: servicesArray,
      projectBudget: Number(projectBudget) || 0,
      onboardedVia: "public_form",
    });

    await AuditLog.create({
      userEmail: cleanEmail,
      userName: client.name,
      action: "Client Onboarded (Public Form)",
      details: `Client ${client.name} registered via public intake form. Services: ${(client.services || []).join(", ") || "None"}. Est. Budget: $${client.projectBudget}.`,
    });

    return NextResponse.json({ success: true, client }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
