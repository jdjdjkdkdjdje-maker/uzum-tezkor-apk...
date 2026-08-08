import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, createSession, normalizePhone } from "@/lib/customer-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const firstName = String(body.firstName ?? "").trim();
    const lastName = String(body.lastName ?? "").trim();
    const phone = normalizePhone(String(body.phone ?? ""));
    const email = body.email ? String(body.email).trim() : null;
    const password = String(body.password ?? "");

    if (!firstName) {
      return NextResponse.json({ error: "Ismingizni kiriting" }, { status: 400 });
    }
    if (!/^\+998\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: "Telefon raqamini to'g'ri kiriting (masalan, +998901234567)" },
        { status: 400 }
      );
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Email manzilini to'g'ri kiriting" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Parol kamida 6 ta belgidan iborat bo'lishi kerak" },
        { status: 400 }
      );
    }

    const existing = await db.select({ id: users.id, passwordHash: users.passwordHash }).from(users).where(eq(users.phone, phone)).limit(1);

    let user;
    if (existing.length > 0) {
      if (existing[0].passwordHash) {
        return NextResponse.json(
          { error: "Bu telefon raqami allaqachon ro'yxatdan o'tgan. Tizimga kiring." },
          { status: 409 }
        );
      }
      // Mavjud mijoz profili (parolsiz) — parol o'rnatib faollashtiramiz
      const [updated] = await db
        .update(users)
        .set({
          firstName,
          lastName,
          email,
          passwordHash: hashPassword(password),
          isVerified: true,
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, existing[0].id))
        .returning();
      user = updated;
    } else {
      const [created] = await db
        .insert(users)
        .values({
          phone,
          email,
          firstName,
          lastName,
          role: "customer",
          passwordHash: hashPassword(password),
          isActive: true,
          isVerified: true,
          language: "uz",
          lastLoginAt: new Date(),
        })
        .returning();
      user = created;
    }

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
    }, { status: 201 });
  } catch (error) {
    console.error("Customer register error:", error);
    return NextResponse.json({ error: "Ro'yxatdan o'tishda xatolik yuz berdi" }, { status: 500 });
  }
}
