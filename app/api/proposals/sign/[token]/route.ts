import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Proposal from "@/lib/models/Proposal";
import Transaction from "@/lib/models/Transaction";
import AuditLog from "@/lib/models/AuditLog";
import { sendEmail } from "@/lib/email";
import { buildSignedEmailHtml, buildSignNotificationHtml, formatMoney } from "@/lib/proposal";
import { buildSignedPdfBase64 } from "@/lib/signedPdf";

function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

// Public: fetch proposal (incl. PDF for viewing). Marks "viewed".
export async function GET(request: Request, { params }: { params: Promise<any> }) {
  try {
    await dbConnect();
    const { token } = await params;

    const proposal = await Proposal.findOne({ token }).select("-createdByEmail -createdByName");
    if (!proposal) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });

    if (!proposal.viewedAt) {
      proposal.viewedAt = new Date();
      if (proposal.status === "sent") proposal.status = "viewed";
      await proposal.save();
    }

    return NextResponse.json(proposal);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Public: client signs or rejects.
export async function POST(request: Request, { params }: { params: Promise<any> }) {
  try {
    await dbConnect();
    const { token } = await params;
    const body = await request.json();
    const action = body.action === "reject" ? "reject" : "sign";

    const proposal = await Proposal.findOne({ token });
    if (!proposal) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    if (proposal.status === "signed") return NextResponse.json({ error: "This proposal has already been signed." }, { status: 400 });

    if (action === "reject") {
      proposal.status = "rejected";
      await proposal.save();
      await AuditLog.create({
        userEmail: proposal.clientEmail, userName: proposal.clientName,
        action: "Rejected Proposal",
        details: `Client rejected proposal ${proposal.proposalNumber || ""}.`,
      });
      return NextResponse.json({ success: true, status: "rejected" });
    }

    const signerName: string = (body.signerName || "").trim();
    if (!signerName) return NextResponse.json({ error: "Please type your full name to sign." }, { status: 400 });

    proposal.status = "signed";
    proposal.signerName = signerName;
    proposal.signatureImage = body.signatureImage || "";
    proposal.signerIp = clientIp(request);
    proposal.signedAt = new Date();

    // Auto-record income.
    const transaction = await Transaction.create({
      type: "income",
      amount: (proposal.totalPrice || 0) - (proposal.discount || 0),
      currency: proposal.currency,
      category: "Client Payment",
      description: `Signed proposal: ${proposal.projectName || proposal.proposalNumber}`,
      date: new Date(),
      client: proposal.clientName,
      project: proposal.projectName,
    });
    proposal.transactionId = String(transaction._id);
    await proposal.save();

    // Email signed PDF (original + appended signature page) to the client.
    try {
      const pdfBase64 = await buildSignedPdfBase64(proposal);
      await sendEmail({
        to: proposal.clientEmail,
        subject: `Signed: ${proposal.projectName || "Project Proposal"}`,
        html: buildSignedEmailHtml(proposal),
        attachments: [{ filename: `${proposal.proposalNumber || "proposal"}-signed.pdf`, content: pdfBase64 }],
      });
    } catch (emailErr: any) {
      console.error("Signed-proposal email failed:", emailErr.message);
    }

    // Notify the company CEO that a proposal was signed.
    if (process.env.CEO_EMAIL) {
      try {
        await sendEmail({
          to: process.env.CEO_EMAIL,
          subject: `Proposal signed by ${proposal.clientName}`,
          html: buildSignNotificationHtml(proposal, proposal.signedAt),
        });
      } catch (notifyErr: any) {
        console.error("CEO notification failed:", notifyErr.message);
      }
    }

    await AuditLog.create({
      userEmail: proposal.clientEmail, userName: signerName,
      action: "Signed Proposal",
      details: `Client signed proposal ${proposal.proposalNumber || ""}. Auto-recorded income of ${formatMoney((proposal.totalPrice || 0) - (proposal.discount || 0), proposal.currency)}.`,
    });

    return NextResponse.json({ success: true, status: "signed" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
