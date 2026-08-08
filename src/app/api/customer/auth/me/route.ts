import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, cartItems, notifications, wishlists } from "@/db/schema";
import { eq, and, or, isNull, sql } from "drizzle-orm";
import { getCustomer, unauthorized, hashPassword, verifyPassword } from "@/lib/customer-auth";

export async function GET() {
  try {
    const user = await getCustomer();
    if (!user) return unauthorized();

    const [cartRow] = await db
      .select({ count: sql<number>`coalesce(sum(${cartItems.quantity}), 0)::int` })
      .from(cartItems)
      .where(eq(cartItems.userId, user.id));

    const [notifRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(
        and(
          or(eq(notifications.userId, user.id), and(isNull(notifications.userId), eq(notifications.isGlobal, true))),
          eq(notifications.isRead, false)
        )
      );

    const favorites = await db
      .select({ productId: wishlists.productId })
      .from(wishlists)
      .where(eq(wishlists.userId, user.id));

    return NextResponse.json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email,
        avatar: user.avatar,
        gender: user.gender,
        birthDate: user.birthDate,
        bonusPoints: user.bonusPoints,
        walletBalance: parseFloat(String(user.walletBalance)),
        createdAt: user.createdAt,
      },
      cartCount: cartRow?.count ?? 0,
      unreadNotifications: notifRow?.count ?? 0,
      favoriteIds: favorites.map((f) => f.productId),
    });
  } catch (error) {
    console.error("Customer me error:", error);
    return NextResponse.json({ error: "Ma'lumotlarni yuklashda xatolik" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCustomer();
    if (!user) return unauthorized();

    const body = await request.json();
    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (typeof body.firstName === "string") updates.firstName = body.firstName.trim();
    if (typeof body.lastName === "string") updates.lastName = body.lastName.trim();
    if (typeof body.email === "string") {
      const email = body.email.trim();
      if (email && !/^\S+@\S+\.\S+$/.test(email)) {
        return NextResponse.json({ error: "Email manzilini to'g'ri kiriting" }, { status: 400 });
      }
      updates.email = email || null;
    }
    if (typeof body.avatar === "string") updates.avatar = body.avatar || null;
    if (body.gender === "male" || body.gender === "female" || body.gender === "other") {
      updates.gender = body.gender;
    }
    if (typeof body.birthDate === "string" && body.birthDate) {
      const d = new Date(body.birthDate);
      if (!isNaN(d.getTime())) updates.birthDate = d;
    }

    // Parolni o'zgartirish
    if (body.newPassword) {
      const current = String(body.currentPassword ?? "");
      if (!user.passwordHash || !verifyPassword(current, user.passwordHash)) {
        return NextResponse.json({ error: "Joriy parol noto'g'ri" }, { status: 400 });
      }
      if (String(body.newPassword).length < 6) {
        return NextResponse.json(
          { error: "Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak" },
          { status: 400 }
        );
      }
      updates.passwordHash = hashPassword(String(body.newPassword));
    }

    const [updated] = await db.update(users).set(updates).where(eq(users.id, user.id)).returning();

    return NextResponse.json({
      user: {
        id: updated.id,
        firstName: updated.firstName,
        lastName: updated.lastName,
        phone: updated.phone,
        email: updated.email,
        avatar: updated.avatar,
        gender: updated.gender,
        birthDate: updated.birthDate,
      },
    });
  } catch (error) {
    console.error("Customer profile update error:", error);
    return NextResponse.json({ error: "Profilni yangilashda xatolik" }, { status: 500 });
  }
}
