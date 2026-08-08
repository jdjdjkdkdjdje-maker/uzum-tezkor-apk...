import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { verifyPassword, createSession, normalizePhone } from "@/lib/customer-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier = String(body.identifier ?? "").trim();
    const password = String(body.password ?? "");

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Telefon/email va parolni kiriting" },
        { status: 400 }
      );
    }

    const phone = normalizePhone(identifier);
    const rows = await db
      .select()
      .from(users)
      .where(or(eq(users.phone, phone), eq(users.email, identifier)))
      .limit(1);

    const user = rows[0];
    if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { error: "Telefon raqam yoki parol noto'g'ri" },
        { status: 401 }
      );
    }
    if (!user.isActive) {
      return NextResponse.json(
        { error: "Hisobingiz bloklangan. Yordam markaziga murojaat qiling." },
        { status: 403 }
      );
    }

    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
    await createSession(user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Customer login error:", error);
    return NextResponse.json({ error: "Kirishda xatolik yuz berdi" }, { status: 500 });
  }
}
