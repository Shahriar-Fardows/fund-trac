import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";

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

    return NextResponse.json(
      { _id: user._id, name: user.name, email: user.email, role: user.role },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
