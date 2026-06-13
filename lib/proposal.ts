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
  const phoneNumber = "+880 1617-643566";

  return `
  <div style="background:#f4f4f5;padding:40px 20px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.08);">

      <!-- Header -->
      <div style="background:linear-gradient(135deg,#18181b,#27272a);padding:35px 30px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:28px;">
          ${escapeHtml(companyName)}
        </h1>

        <p style="margin:8px 0 0;color:#a1a1aa;font-size:13px;letter-spacing:1px;text-transform:uppercase;">
          Project Proposal Ready
        </p>
      </div>

      <!-- Body -->
      <div style="padding:35px 30px;color:#3f3f46;line-height:1.7;">

        <p style="font-size:16px;color:#18181b;margin-top:0;">
          Hello <strong>${escapeHtml(p.clientName)}</strong>,
        </p>

        <p>
          Thank you for considering us for your project.
          Your proposal has been prepared and is ready for review.
        </p>

        <!-- Info Box -->
        <div style="background:#fafafa;border:1px solid #e4e4e7;border-radius:12px;padding:18px;margin:25px 0;">
          <p style="margin:0 0 10px;font-weight:bold;color:#18181b;">
            Proposal Includes
          </p>

          <ul style="padding-left:18px;margin:0;color:#52525b;">
            <li>Project Scope & Deliverables</li>
            <li>Development Timeline</li>
            <li>Pricing & Payment Schedule</li>
            <li>Terms & Conditions</li>
            <li>Digital Signature Approval</li>
          </ul>
        </div>

        <p>
          Please review the proposal carefully. If everything meets your expectations,
          you can approve and sign it securely online.
        </p>

        <p>
          After signing, a finalized PDF copy will automatically be generated and sent
          to your email for future reference.
        </p>

        <!-- CTA -->
        <div style="text-align:center;margin:35px 0;">
          <a
            href="${signUrl}"
            style="
              display:inline-block;
              background:#18181b;
              color:#ffffff;
              text-decoration:none;
              padding:15px 34px;
              border-radius:10px;
              font-size:15px;
              font-weight:bold;
            "
          >
            Review & Sign Proposal
          </a>
        </div>

        <!-- Backup URL -->
        <div style="background:#fafafa;border-radius:10px;padding:15px;">
          <p style="margin:0 0 8px;font-size:13px;color:#71717a;">
            If the button above does not work, copy and paste this link into your browser:
          </p>

          <p style="
            margin:0;
            font-size:13px;
            word-break:break-all;
            color:#2563eb;
          ">
            ${signUrl}
          </p>
        </div>

        <!-- Trust Box -->
        <div style="
          margin-top:25px;
          background:#f0fdf4;
          border:1px solid #bbf7d0;
          border-radius:10px;
          padding:14px;
        ">
          <p style="margin:0;font-size:13px;color:#166534;">
            ✓ Secure online signing<br>
            ✓ Instant PDF copy after approval<br>
            ✓ Accessible from any device
          </p>
        </div>

        <p style="margin-top:30px;">
          If you have any questions or would like any modifications before approval,
          feel free to contact us.
        </p>

        <p>
          We look forward to working with you.
        </p>

      </div>

      <!-- Footer -->
      <div style="border-top:1px solid #e4e4e7;padding:25px 30px;background:#fafafa;">

        <p style="margin:0;font-size:14px;color:#18181b;">
          <strong>${escapeHtml(companyName)}</strong>
        </p>

        <p style="margin:8px 0 0;font-size:13px;color:#71717a;">
          <a href="mailto:${displayEmail}" style="color:#2563eb;text-decoration:none;">
            ${escapeHtml(displayEmail)}
          </a>
        </p>

        <p style="margin:5px 0 0;font-size:13px;color:#71717a;">
          ${escapeHtml(phoneNumber)}
        </p>

      </div>

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
