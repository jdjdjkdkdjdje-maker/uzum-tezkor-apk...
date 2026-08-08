import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  products, productImages, categories, brands, inventory, reviews, users,
  recentlyViewed, orders, orderItems, relatedProducts,
} from "@/db/schema";
import { sql, eq, and, desc, asc, ne, inArray } from "drizzle-orm";
import { fetchProductCards } from "@/lib/customer-products";
import { getCustomer } from "@/lib/customer-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);
    if (isNaN(productId)) {
      return NextResponse.json({ error: "Mahsulot topilmadi" }, { status: 404 });
    }

    const rows = await db
      .select({
        product: products,
        categoryName: categories.name,
        categorySlug: categories.slug,
        brandName: brands.name,
        quantity: inventory.quantity,
        reserved: inventory.reservedQuantity,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(brands, eq(products.brandId, brands.id))
      .leftJoin(inventory, eq(products.id, inventory.productId))
      .where(eq(products.id, productId))
      .limit(1);

    const row = rows[0];
    if (!row || row.product.status === "discontinued") {
      return NextResponse.json({ error: "Mahsulot topilmadi" }, { status: 404 });
    }
    const p = row.product;

    const [images, productReviews] = await Promise.all([
      db
        .select({ id: productImages.id, url: productImages.url, isPrimary: productImages.isPrimary })
        .from(productImages)
        .where(eq(productImages.productId, productId))
        .orderBy(desc(productImages.isPrimary), asc(productImages.sortOrder)),
      db
        .select({
          id: reviews.id,
          rating: reviews.rating,
          comment: reviews.comment,
          isVerified: reviews.isVerified,
          helpfulCount: reviews.helpfulCount,
          createdAt: reviews.createdAt,
          userFirstName: users.firstName,
          userLastName: users.lastName,
          userAvatar: users.avatar,
        })
        .from(reviews)
        .leftJoin(users, eq(reviews.userId, users.id))
        .where(and(eq(reviews.productId, productId), eq(reviews.isApproved, true)))
        .orderBy(desc(reviews.createdAt))
        .limit(30),
    ]);

    // O'xshash mahsulotlar: avval related_products, keyin shu kategoriyadan
    const related = await db
      .select({ relatedProductId: relatedProducts.relatedProductId })
      .from(relatedProducts)
      .where(eq(relatedProducts.productId, productId));

    let similar;
    if (related.length > 0) {
      similar = await fetchProductCards({
        where: and(
          eq(products.status, "active"),
          inArray(products.id, related.map((r) => r.relatedProductId))
        ),
        limit: 8,
      });
    } else {
      similar = await fetchProductCards({
        where: and(
          eq(products.status, "active"),
          p.categoryId ? eq(products.categoryId, p.categoryId) : sql`true`,
          ne(products.id, productId)
        ),
        orderBy: desc(products.totalSold),
        limit: 8,
      });
    }

    // Ko'rishlar sonini oshirish
    db.update(products)
      .set({ totalViews: sql`${products.totalViews} + 1` })
      .where(eq(products.id, productId))
      .then(() => {})
      .catch(() => {});

    // Foydalanuvchi holati
    const user = await getCustomer();
    let canReview = false;
    let myReview = null;
    if (user) {
      // Oxirgi ko'rilganlar
      await db.delete(recentlyViewed).where(
        and(eq(recentlyViewed.userId, user.id), eq(recentlyViewed.productId, productId))
      );
      await db.insert(recentlyViewed).values({ userId: user.id, productId });

      const deliveredOrders = await db
        .select({ id: orders.id })
        .from(orders)
        .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
        .where(
          and(eq(orders.userId, user.id), eq(orders.status, "delivered"), eq(orderItems.productId, productId))
        )
        .limit(1);

      const existingReview = await db
        .select({ id: reviews.id, rating: reviews.rating, comment: reviews.comment, isApproved: reviews.isApproved, createdAt: reviews.createdAt })
        .from(reviews)
        .where(and(eq(reviews.productId, productId), eq(reviews.userId, user.id)))
        .limit(1);

      myReview = existingReview[0] ?? null;
      canReview = deliveredOrders.length > 0 && !myReview;
    }

    const available = Math.max(0, (row.quantity ?? 0) - (row.reserved ?? 0));

    return NextResponse.json({
      product: {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        ingredients: p.ingredients,
        price: parseFloat(String(p.price)),
        oldPrice: p.oldPrice ? parseFloat(String(p.oldPrice)) : null,
        discountPercent: p.discountPercent,
        weight: p.weight ? parseFloat(String(p.weight)) : null,
        weightUnit: p.weightUnit,
        volume: p.volume ? parseFloat(String(p.volume)) : null,
        volumeUnit: p.volumeUnit,
        calories: p.calories,
        manufacturer: p.manufacturer,
        countryOfOrigin: p.countryOfOrigin,
        storageConditions: p.storageConditions,
        status: p.status,
        isFeatured: p.isFeatured,
        isNew: p.isNew,
        isOrganic: p.isOrganic,
        totalSold: p.totalSold,
        averageRating: p.averageRating,
        reviewCount: p.reviewCount,
        categoryId: p.categoryId,
        categoryName: row.categoryName,
        brandId: p.brandId,
        brandName: row.brandName,
        available,
        images: images.map((i) => i.url),
      },
      reviews: productReviews,
      similarProducts: similar,
      canReview,
      myReview,
    });
  } catch (error) {
    console.error("Customer product detail error:", error);
    return NextResponse.json({ error: "Mahsulotni yuklashda xatolik" }, { status: 500 });
  }
}
