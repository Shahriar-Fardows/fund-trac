import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Proposal from "@/lib/models/Proposal";
import AuditLog from "@/lib/models/AuditLog";
import { pickProposalData } from "../route";

export async function GET(request: Request, { params }: { params: Promise<any> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const proposal = await Proposal.findById(id);
    if (!proposal) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    return NextResponse.json(proposal);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<any> }) {
  try {
    await dbConnect();
    const { id } = await params;

    const role = request.headers.get("x-user-role");
    const userEmail = request.headers.get("x-user-email") || "unknown@shahriar.com";
    const userName = request.headers.get("x-user-name") || "System User";
    if (role !== "admin") return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });

    const existing = await Proposal.findById(id);
    if (!existing) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    if (existing.status === "signed") return NextResponse.json({ error: "A signed proposal can no longer be edited." }, { status: 400 });

    const data = pickProposalData(await request.json());
    const proposal = await Proposal.findByIdAndUpdate(id, data, { new: true });

    await AuditLog.create({
      userEmail, userName,
      action: "Edited Proposal",
      details: `Edited proposal ${existing.proposalNumber || id} (${proposal.clientName}).`,
    });

    const obj = proposal.toObject();
    delete obj.pdfFile;
    return NextResponse.json(obj);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<any> }) {
  try {
    await dbConnect();
    const { id } = await params;

    const role = request.headers.get("x-user-role");
    const userEmail = request.headers.get("x-user-email") || "unknown@shahriar.com";
    const userName = request.headers.get("x-user-name") || "System User";
    if (role !== "admin") return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });

    const proposal = await Proposal.findById(id);
    if (!proposal) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });

    await Proposal.findByIdAndDelete(id);
    await AuditLog.create({
      userEmail, userName,
      action: "Deleted Proposal",
      details: `Deleted proposal ${proposal.proposalNumber || id} (${proposal.clientName}).`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
