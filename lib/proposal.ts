import { formatMoney } from "./pricing";
export { formatMoney };

type ProposalLike = {
  clientName: string;
  clientEmail: string;
  companyName?: string;
  projectName?: string;
  totalPrice?: number;
  currency: string;
  signerName?: string;
};

function heading(p: ProposalLike): string {
  return p.projectName || "Project Proposal";
}

export function buildProposalEmailHtml(p: ProposalLike, signUrl: string): string {
  const companyName = process.env.COMPANY_NAME || "TEACHFOSYS";
  const emailAddress = process.env.CEO_EMAIL || "info@teachfosys.com";
  // Clean up domain if it doesn't end with .com/.net/etc in env
  const displayEmail = emailAddress.includes("@") && !emailAddress.includes(".com") && !emailAddress.includes(".org") && !emailAddress.includes(".net")
    ? `${emailAddress}.com`
    : emailAddress;
  const phoneNumber = "+880 1700-000000";

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;border:1px solid #e4e4e7;border-radius:14px;overflow:hidden;">
    <div style="background:#18181b;padding:22px 28px;">
      <span style="color:#22c55e;font-size:18px;font-weight:bold;">${escapeHtml(companyName)}</span>
      <span style="color:#a1a1aa;font-size:11px;display:block;letter-spacing:1px;text-transform:uppercase;">Project Proposal</span>
    </div>
    <div style="padding:28px;color:#3f3f46;font-size:14px;line-height:1.6;">
      <p style="color:#18181b;font-size:15px;font-weight:bold;margin:0 0 14px;">Hello ${escapeHtml(p.clientName)},</p>
      
      <p style="margin:0 0 14px;">Your project proposal is now ready for review.</p>
      
      <p style="margin:0 0 14px;">
        Please take a moment to review the proposal online, where you can view the complete project scope, deliverables, timeline, pricing, and terms. If everything looks good, you can securely sign the proposal directly on the page.
      </p>
      
      <p style="margin:0 0 14px;">
        Once the proposal has been signed, a finalized PDF copy will be automatically generated and sent to your email for your records.
      </p>
      
      <p style="margin:0 0 14px;">
        If you have any questions or would like to discuss any part of the proposal, please feel free to reach out before signing.
      </p>
      
      <p style="margin:0 0 20px;">We look forward to working with you.</p>
      
      <div style="margin-bottom:24px;">
        <a href="${signUrl}" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;font-size:14px;font-weight:bold;padding:12px 26px;border-radius:9px;">
          View &amp; Sign Proposal
        </a>
      </div>
      
      <p style="color:#71717a;font-size:12px;margin:0 0 24px;">Or copy this link to your browser:<br/>${signUrl}</p>
      
      <hr style="border:0;border-top:1px solid #e4e4e7;margin:20px 0;" />
      
      <p style="margin:0;color:#71717a;font-size:13px;line-height:1.5;">
        Best regards,<br/><br/>
        <strong style="color:#18181b;">${escapeHtml(companyName)}</strong><br/>
        <a href="mailto:${displayEmail}" style="color:#2563eb;text-decoration:none;">${escapeHtml(displayEmail)}</a><br/>
        <span>${escapeHtml(phoneNumber)}</span>
      </p>
    </div>
  </div>
  <img src="${signUrl.replace("/proposals/sign/", "/api/proposals/track/")}" width="1" height="1" style="display:none" alt="" />`;
}

/** Confirmation email sent to the client after signing (PDF attached). */
export function buildSignedEmailHtml(p: ProposalLike): string {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;border:1px solid #e4e4e7;border-radius:14px;overflow:hidden;">
    <div style="background:#16a34a;padding:22px 28px;">
      <span style="color:#fff;font-size:18px;font-weight:bold;">Proposal Signed ✓</span>
    </div>
    <div style="padding:28px;">
      <p style="color:#18181b;font-size:15px;margin:0 0 14px;">Hello ${escapeHtml(p.clientName)},</p>
      <p style="color:#3f3f46;font-size:14px;line-height:1.6;margin:0 0 18px;">
        Thank you for signing <strong>${escapeHtml(heading(p))}</strong>.
        Your signed PDF copy is attached to this email for your records.
      </p>
      <div style="background:#fafafa;border:1px solid #e4e4e7;border-radius:10px;padding:18px;">
        <table style="width:100%;font-size:14px;color:#3f3f46;border-collapse:collapse;">
          ${p.projectName ? `<tr><td style="padding:4px 0;color:#71717a;">Project</td><td style="padding:4px 0;text-align:right;font-weight:bold;color:#18181b;">${escapeHtml(p.projectName)}</td></tr>` : ""}
          <tr><td style="padding:4px 0;color:#71717a;">Amount</td><td style="padding:4px 0;text-align:right;font-weight:bold;color:#18181b;">${formatMoney(p.totalPrice || 0, p.currency)}</td></tr>
          <tr><td style="padding:4px 0;color:#71717a;">Signed by</td><td style="padding:4px 0;text-align:right;font-weight:bold;color:#18181b;">${escapeHtml(p.signerName || p.clientName)}</td></tr>
        </table>
      </div>
    </div>
  </div>`;
}

/** Notification emailed to the company CEO when a client signs a proposal. */
export function buildSignNotificationHtml(
  p: ProposalLike & { proposalNumber?: string; signerIp?: string },
  signedAt: Date
): string {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;border:1px solid #e4e4e7;border-radius:14px;overflow:hidden;">
    <div style="background:#16a34a;padding:20px 28px;">
      <span style="color:#fff;font-size:17px;font-weight:bold;">✓ Proposal Signed</span>
    </div>
    <div style="padding:26px;">
      <p style="color:#3f3f46;font-size:14px;line-height:1.6;margin:0 0 16px;">
        A client has just signed a proposal.
      </p>
      <div style="background:#fafafa;border:1px solid #e4e4e7;border-radius:10px;padding:18px;">
        <table style="width:100%;font-size:14px;color:#3f3f46;border-collapse:collapse;">
          ${p.proposalNumber ? `<tr><td style="padding:4px 0;color:#71717a;">Proposal</td><td style="padding:4px 0;text-align:right;font-weight:bold;color:#18181b;">${escapeHtml(p.proposalNumber)}</td></tr>` : ""}
          ${p.projectName ? `<tr><td style="padding:4px 0;color:#71717a;">Project</td><td style="padding:4px 0;text-align:right;font-weight:bold;color:#18181b;">${escapeHtml(p.projectName)}</td></tr>` : ""}
          <tr><td style="padding:4px 0;color:#71717a;">Client</td><td style="padding:4px 0;text-align:right;font-weight:bold;color:#18181b;">${escapeHtml(p.clientName)}</td></tr>
          <tr><td style="padding:4px 0;color:#71717a;">Signed by</td><td style="padding:4px 0;text-align:right;font-weight:bold;color:#18181b;">${escapeHtml(p.signerName || p.clientName)}</td></tr>
          <tr><td style="padding:4px 0;color:#71717a;">Amount</td><td style="padding:4px 0;text-align:right;font-weight:bold;color:#18181b;">${formatMoney(p.totalPrice || 0, p.currency)}</td></tr>
          <tr><td style="padding:4px 0;color:#71717a;">Signed at</td><td style="padding:4px 0;text-align:right;color:#18181b;">${escapeHtml(signedAt.toLocaleString("en-GB"))}</td></tr>
          ${p.signerIp ? `<tr><td style="padding:4px 0;color:#71717a;">IP</td><td style="padding:4px 0;text-align:right;color:#18181b;">${escapeHtml(p.signerIp)}</td></tr>` : ""}
        </table>
      </div>
      <p style="color:#a1a1aa;font-size:12px;margin:16px 0 0;">The income has been auto-recorded in Fund Trac.</p>
    </div>
  </div>`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
