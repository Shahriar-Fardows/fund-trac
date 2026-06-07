import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<any> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const role = request.headers.get("x-user-role");
    const userEmail = request.headers.get("x-user-email");

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    }

    const target = await User.findById(id);
    if (!target) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Prevent admin from deleting themselves
    if (target.email === userEmail) {
      return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
    }

    await User.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
