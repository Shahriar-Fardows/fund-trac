import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Proposal from "@/lib/models/Proposal";
import AuditLog from "@/lib/models/AuditLog";
import { sendEmail } from "@/lib/email";
import { buildProposalEmailHtml } from "@/lib/proposal";

function getBaseUrl(request: Request): string {
  const proto = request.headers.get("x-forwarded-proto") || "http";
  const host = request.headers.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}

export async function POST(request: Request, { params }: { params: Promise<any> }) {
  try {
    await dbConnect();
    const { id } = await params;

    const role = request.headers.get("x-user-role");
    const userEmail = request.headers.get("x-user-email") || "unknown@shahriar.com";
    const userName = request.headers.get("x-user-name") || "System User";
    if (role !== "admin") return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });

    const proposal = await Proposal.findById(id);
    if (!proposal) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    if (proposal.status === "signed") return NextResponse.json({ error: "This proposal has already been signed." }, { status: 400 });
    if (!proposal.pdfFile) return NextResponse.json({ error: "Upload a PDF before sending." }, { status: 400 });

    const signUrl = `${getBaseUrl(request)}/proposals/sign/${proposal.token}`;

    await sendEmail({
      to: proposal.clientEmail,
      subject: `Proposal: ${proposal.projectName || "Project Proposal"}`,
      html: buildProposalEmailHtml(proposal, signUrl),
    });

    if (proposal.status === "draft" || proposal.status === "rejected") proposal.status = "sent";
    proposal.sentAt = new Date();
    await proposal.save();

    await AuditLog.create({
      userEmail, userName,
      action: "Sent Proposal",
      details: `Sent proposal ${proposal.proposalNumber || ""} to ${proposal.clientEmail}.`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
