import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";

export async function GET() {
  try {
    await dbConnect();
    const adminCount = await User.countDocuments({ role: "admin" });
    return NextResponse.json({ adminExists: adminCount > 0 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
