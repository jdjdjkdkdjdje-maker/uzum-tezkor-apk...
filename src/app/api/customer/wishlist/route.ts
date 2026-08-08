import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { wishlists, products } from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { getCustomer, unauthorized } from "@/lib/customer-auth";
import { fetchProductCards } from "@/lib/customer-products";

export async function GET() {
  try {
    const user = await getCustomer();
    if (!user) return unauthorized();

    const rows = await db
      .select({ productId: wishlists.productId, createdAt: wishlists.createdAt })
      .from(wishlists)
      .where(eq(wishlists.userId, user.id))
      .orderBy(desc(wishlists.createdAt));

    if (rows.length === 0) {
      return NextResponse.json({ products: [], favoriteIds: [] });
    }

    const ids = rows.map((r) => r.productId);
    const cards = await fetchProductCards({
      where: inArray(products.id, ids),
      limit: 200,
    });
    // Wishlist tartibida saqlash
    const order = new Map(ids.map((id, i) => [id, i]));
    cards.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

    return NextResponse.json({ products: cards, favoriteIds: ids });
  } catch (error) {
    console.error("Wishlist GET error:", error);
    return NextResponse.json({ error: "Sevimlilarni yuklashda xatolik" }, { status: 500 });
  }
}

// Toggle: qo'shish / olib tashlash
export async function POST(request: NextRequest) {
  try {
    const user = await getCustomer();
    if (!user) return unauthorized();

    const body = await request.json();
    const productId = parseInt(String(body.productId));
    if (isNaN(productId)) {
      return NextResponse.json({ error: "Mahsulot tanlanmadi" }, { status: 400 });
    }

    const existing = await db
      .select({ id: wishlists.id })
      .from(wishlists)
      .where(and(eq(wishlists.userId, user.id), eq(wishlists.productId, productId)))
      .limit(1);

    let added: boolean;
    if (existing[0]) {
      await db.delete(wishlists).where(eq(wishlists.id, existing[0].id));
      added = false;
    } else {
      await db.insert(wishlists).values({ userId: user.id, productId });
      added = true;
    }

    const all = await db
      .select({ productId: wishlists.productId })
      .from(wishlists)
      .where(eq(wishlists.userId, user.id));

    return NextResponse.json({ added, favoriteIds: all.map((r) => r.productId) });
  } catch (error) {
    console.error("Wishlist POST error:", error);
    return NextResponse.json({ error: "Sevimlilarga qo'shishda xatolik" }, { status: 500 });
  }
}
