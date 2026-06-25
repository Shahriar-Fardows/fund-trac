import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import { sendEmail } from "@/lib/email";

export async function GET(request: Request) {
  try {
    await dbConnect();

    const role = request.headers.get("x-user-role");
    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    }

    const users = await User.find({}, { password: 0 }); // exclude passwords
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();

    const role = request.headers.get("x-user-role");
    if (role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can create new accounts." },
        { status: 403 }
      );
    }

    const { name, email, password, memberRole } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: memberRole === "admin" ? "admin" : "viewer",
    });

    // Send credentials email
    const proto = request.headers.get("x-forwarded-proto") || "http";
    const host = request.headers.get("host") || "localhost:3000";
    const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL || `${proto}://${host}`;

    try {
      await sendEmail({
        to: email,
        subject: `Your ${process.env.COMPANY_NAME || "Shahriar"} Portal Account Credentials`,
        html: `
          <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;border:1px solid #e4e4e7;border-radius:14px;overflow:hidden;">
            <div style="background:#18181b;padding:22px 28px;text-align:center;">
              <span style="color:#fff;font-size:18px;font-weight:bold;">Account Created</span>
            </div>
            <div style="padding:28px;color:#3f3f46;font-size:14px;line-height:1.6;">
              <p>Hello <strong>${name}</strong>,</p>
              <p>An administrator has created a team account for you on the Shahriar Finance Portal. You can log in using the credentials below:</p>
              <div style="background:#fafafa;border:1px solid #e4e4e7;border-radius:10px;padding:18px;margin:20px 0;">
                <table style="width:100%;font-size:14px;color:#3f3f46;border-collapse:collapse;">
                  <tr><td style="padding:6px 0;color:#71717a;">Portal URL:</td><td style="padding:6px 0;font-weight:bold;color:#2563eb;"><a href="${portalUrl}" style="color:#2563eb;text-decoration:none;">${portalUrl}</a></td></tr>
                  <tr><td style="padding:6px 0;color:#71717a;">Username/Email:</td><td style="padding:6px 0;font-weight:bold;color:#18181b;">${email}</td></tr>
                  <tr><td style="padding:6px 0;color:#71717a;">Password:</td><td style="padding:6px 0;font-weight:bold;color:#18181b;">${password}</td></tr>
                </table>
              </div>
              <p style="margin-top:20px;">For security, we recommend that you change your password once you log in by visiting your Profile page.</p>
              <p style="margin-top:24px;font-size:12px;color:#a1a1aa;border-top:1px solid #e4e4e7;padding-top:16px;">Shahriar Finance</p>
            </div>
          </div>
        `,
      });
    } catch (emailErr: any) {
      console.error("Welcome email failed to send:", emailErr.message);
    }

    return NextResponse.json(
      { _id: user._id, name: user.name, email: user.email, role: user.role },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
