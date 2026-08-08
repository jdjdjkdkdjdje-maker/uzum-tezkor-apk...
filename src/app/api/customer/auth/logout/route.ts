import { NextResponse } from "next/server";
import { destroySession } from "@/lib/customer-auth";

export async function POST() {
  try {
    await destroySession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Customer logout error:", error);
    return NextResponse.json({ error: "Chiqishda xatolik yuz berdi" }, { status: 500 });
  }
}
