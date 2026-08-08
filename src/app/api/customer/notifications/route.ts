import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and, or, isNull, desc } from "drizzle-orm";
import { getCustomer, unauthorized } from "@/lib/customer-auth";

export async function GET() {
  try {
    const user = await getCustomer();
    if (!user) return unauthorized();

    const rows = await db
      .select()
      .from(notifications)
      .where(
        or(
          eq(notifications.userId, user.id),
          and(isNull(notifications.userId), eq(notifications.isGlobal, true))
        )
      )
      .orderBy(desc(notifications.createdAt))
      .limit(100);

    return NextResponse.json({ notifications: rows });
  } catch (error) {
    console.error("Notifications GET error:", error);
    return NextResponse.json({ error: "Bildirishnomalarni yuklashda xatolik" }, { status: 500 });
  }
}

// O'qilgan deb belgilash: {id} — bitta, {all:true} — hammasi
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCustomer();
    if (!user) return unauthorized();

    const body = await request.json().catch(() => ({}));

    if (body.all) {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, user.id));
    } else if (body.id) {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.id, parseInt(String(body.id))), eq(notifications.userId, user.id)));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notifications PATCH error:", error);
    return NextResponse.json({ error: "Bildirishnomani yangilashda xatolik" }, { status: 500 });
  }
}
