import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import dbConnect from "@/lib/db";
import Proposal from "@/lib/models/Proposal";
import AuditLog from "@/lib/models/AuditLog";
import { formatMoney } from "@/lib/proposal";

const EDITABLE_FIELDS = [
  "clientName", "companyName", "clientPhone", "clientEmail",
  "projectName", "totalPrice", "discount", "currency", "pdfFile", "pdfName", "refundPolicy",
] as const;

export function pickProposalData(body: any) {
  const data: any = {};
  for (const key of EDITABLE_FIELDS) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  if (data.totalPrice !== undefined) data.totalPrice = Number(data.totalPrice) || 0;
  if (data.discount !== undefined) data.discount = Number(data.discount) || 0;
  if (data.refundPolicy !== undefined) data.refundPolicy = String(data.refundPolicy || "").trim();
  if (data.currency && data.currency !== "BDT" && data.currency !== "USD") data.currency = "USD";
  return data;
}

export async function GET() {
  try {
    await dbConnect();
    const proposals = await Proposal.find()
      .select("-pdfFile -signatureImage")
      .sort({ createdAt: -1 });
    return NextResponse.json(proposals);
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

    const body = await request.json();
    if (!body.clientName || !body.clientEmail) {
      return NextResponse.json({ error: "Client name and email are required." }, { status: 400 });
    }
    if (!body.pdfFile) {
      return NextResponse.json({ error: "Please upload the proposal PDF." }, { status: 400 });
    }

    const data = pickProposalData(body);

    const year = new Date().getFullYear();
    const count = await Proposal.countDocuments({ proposalNumber: new RegExp(`^PROP-${year}-`) });
    const proposalNumber = `PROP-${year}-${String(count + 1).padStart(4, "0")}`;

    const proposal = await Proposal.create({
      ...data,
      proposalNumber,
      token: randomUUID(),
      status: "draft",
      createdByEmail: userEmail,
      createdByName: userName,
    });

    await AuditLog.create({
      userEmail,
      userName,
      action: "Created Proposal",
      details: `Created proposal ${proposalNumber} for ${proposal.clientName} (${formatMoney(proposal.totalPrice, proposal.currency)}).`,
    });

    // Don't echo the (large) pdf back.
    const obj = proposal.toObject();
    delete obj.pdfFile;
    return NextResponse.json(obj, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
