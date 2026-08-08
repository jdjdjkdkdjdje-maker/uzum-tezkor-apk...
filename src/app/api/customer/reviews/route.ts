import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reviews, orders, orderItems, products } from "@/db/schema";
import { sql, eq, and } from "drizzle-orm";
import { getCustomer, unauthorized } from "@/lib/customer-auth";

// Sharh qoldirish — faqat yetkazib berilgan buyurtmadagi mahsulot uchun
export async function POST(request: NextRequest) {
  try {
    const user = await getCustomer();
    if (!user) return unauthorized();

    const body = await request.json();
    const productId = parseInt(String(body.productId));
    const rating = parseInt(String(body.rating));
    const comment = body.comment ? String(body.comment).trim() : null;

    if (isNaN(productId)) {
      return NextResponse.json({ error: "Mahsulot tanlanmadi" }, { status: 400 });
    }
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Bahoni 1 dan 5 gacha tanlang" }, { status: 400 });
    }

    // Yetkazib berilgan buyurtma tekshiruvi
    const delivered = await db
      .select({ orderId: orders.id })
      .from(orders)
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .where(
        and(eq(orders.userId, user.id), eq(orders.status, "delivered"), eq(orderItems.productId, productId))
      )
      .limit(1);

    if (delivered.length === 0) {
      return NextResponse.json(
        { error: "Sharh qoldirish uchun bu mahsulotni xarid qilib, yetkazib olishingiz kerak" },
        { status: 403 }
      );
    }

    const existing = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(and(eq(reviews.productId, productId), eq(reviews.userId, user.id)))
      .limit(1);
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Siz bu mahsulotga allaqachon sharh qoldirgansiz" },
        { status: 409 }
      );
    }

    const [created] = await db
      .insert(reviews)
      .values({
        productId,
        userId: user.id,
        orderId: delivered[0].orderId,
        rating,
        comment,
        isVerified: true,
        isApproved: true,
      })
      .returning();

    // Mahsulot reytingini yangilash
    const [agg] = await db
      .select({
        avg: sql<number>`coalesce(avg(${reviews.rating}), 0)::float`,
        count: sql<number>`count(*)::int`,
      })
      .from(reviews)
      .where(and(eq(reviews.productId, productId), eq(reviews.isApproved, true)));

    await db
      .update(products)
      .set({
        averageRating: Math.round((agg?.avg ?? 0) * 10) / 10,
        reviewCount: agg?.count ?? 0,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));

    return NextResponse.json({ review: created }, { status: 201 });
  } catch (error) {
    console.error("Customer review error:", error);
    return NextResponse.json({ error: "Sharh qoldirishda xatolik" }, { status: 500 });
  }
}
