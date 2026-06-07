import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";

export async function POST(request: Request) {
  try {
    await dbConnect();

    // Only allow registration if no admin exists yet
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount > 0) {
      return NextResponse.json(
        { error: "Setup already completed. Admin account already exists." },
        { status: 403 }
      );
    }

    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const user = await User.create({
      name,
      email,
      password,
      role: "admin",
    });

    return NextResponse.json(
      { email: user.email, name: user.name, role: user.role },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
