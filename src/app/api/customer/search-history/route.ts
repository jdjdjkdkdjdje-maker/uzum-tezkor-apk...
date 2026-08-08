import { NextResponse } from "next/server";
import { db } from "@/db";
import { searchHistory } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getCustomer, unauthorized } from "@/lib/customer-auth";

export async function GET() {
  try {
    const user = await getCustomer();
    if (!user) return unauthorized();

    const rows = await db
      .select({
        query: searchHistory.query,
        latest: sql<string>`max(${searchHistory.createdAt})`,
      })
      .from(searchHistory)
      .where(eq(searchHistory.userId, user.id))
      .groupBy(searchHistory.query)
      .orderBy(desc(sql`max(${searchHistory.createdAt})`))
      .limit(10);

    return NextResponse.json({ history: rows.map((r) => r.query) });
  } catch (error) {
    console.error("Search history GET error:", error);
    return NextResponse.json({ error: "Qidiruv tarixini yuklashda xatolik" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = await getCustomer();
    if (!user) return unauthorized();

    await db.delete(searchHistory).where(eq(searchHistory.userId, user.id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Search history DELETE error:", error);
    return NextResponse.json({ error: "Tarixni tozalashda xatolik" }, { status: 500 });
  }
}
