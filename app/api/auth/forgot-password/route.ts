import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { email } = await request.json();

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email address is required." }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json({ error: "No account found with this email address." }, { status: 404 });
    }

    const token = randomUUID();
    user.resetToken = token;
    user.resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    const proto = request.headers.get("x-forwarded-proto") || "http";
    const host = request.headers.get("host") || "localhost:3000";
    const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL || `${proto}://${host}`;
    const resetUrl = `${portalUrl}/reset-password?token=${token}`;

    try {
      await sendEmail({
        to: user.email,
        subject: `Reset your ${process.env.COMPANY_NAME || "Shahriar"} Portal Password`,
        html: `
          <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;border:1px solid #e4e4e7;border-radius:14px;overflow:hidden;">
            <div style="background:#18181b;padding:22px 28px;text-align:center;">
              <span style="color:#fff;font-size:18px;font-weight:bold;">Password Reset Request</span>
            </div>
            <div style="padding:28px;color:#3f3f46;font-size:14px;line-height:1.6;">
              <p>Hello <strong>${user.name}</strong>,</p>
              <p>We received a request to reset your password for the Shahriar Finance Portal. Click the button below to choose a new password:</p>
              <div style="text-align:center;margin:30px 0;">
                <a href="${resetUrl}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:bold;">
                  Reset Password
                </a>
              </div>
              <p>If the button above does not work, copy and paste this link into your browser:</p>
              <p style="word-break:break-all;color:#2563eb;">${resetUrl}</p>
              <p style="margin-top:20px;font-size:12px;color:#71717a;">This link is valid for 1 hour. If you did not request a password reset, please ignore this email.</p>
              <p style="margin-top:24px;font-size:12px;color:#a1a1aa;border-top:1px solid #e4e4e7;padding-top:16px;">Shahriar Finance</p>
            </div>
          </div>
        `,
      });
    } catch (emailErr: any) {
      console.error("Forgot password email failed to send:", emailErr.message);
      return NextResponse.json({ error: "Failed to send reset email. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Reset email sent successfully." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
