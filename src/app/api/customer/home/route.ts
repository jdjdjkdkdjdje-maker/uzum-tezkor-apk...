import { NextResponse } from "next/server";
import { db } from "@/db";
import { banners, categories, products, promotions } from "@/db/schema";
import { sql, eq, and, or, isNull, lte, gte, desc, asc, gt } from "drizzle-orm";
import { fetchProductCards } from "@/lib/customer-products";

export async function GET() {
  try {
    const now = new Date();

    const [activeBanners, activeCategories, activePromotions, featured, fresh, discounted, popular] =
      await Promise.all([
        db
          .select({
            id: banners.id,
            title: banners.title,
            subtitle: banners.subtitle,
            image: banners.image,
            mobileImage: banners.mobileImage,
            link: banners.link,
            type: banners.type,
          })
          .from(banners)
          .where(
            and(
              eq(banners.isActive, true),
              or(isNull(banners.startsAt), lte(banners.startsAt, now)),
              or(isNull(banners.endsAt), gte(banners.endsAt, now))
            )
          )
          .orderBy(asc(banners.sortOrder)),
        db
          .select({
            id: categories.id,
            name: categories.name,
            slug: categories.slug,
            image: categories.image,
            icon: categories.icon,
            color: categories.color,
            productCount: sql<number>`(SELECT count(*)::int FROM products p WHERE p.category_id = ${categories.id} AND p.status = 'active')`,
          })
          .from(categories)
          .where(and(eq(categories.isActive, true), isNull(categories.parentId)))
          .orderBy(asc(categories.sortOrder)),
        db
          .select({
            id: promotions.id,
            name: promotions.name,
            description: promotions.description,
            image: promotions.image,
            discountType: promotions.discountType,
            discountValue: promotions.discountValue,
            endsAt: promotions.endsAt,
          })
          .from(promotions)
          .where(and(eq(promotions.isActive, true), lte(promotions.startsAt, now), gte(promotions.endsAt, now)))
          .orderBy(desc(promotions.createdAt)),
        fetchProductCards({
          where: and(eq(products.status, "active"), eq(products.isFeatured, true)),
          orderBy: desc(products.totalSold),
          limit: 10,
        }),
        fetchProductCards({
          where: and(eq(products.status, "active"), eq(products.isNew, true)),
          orderBy: desc(products.createdAt),
          limit: 10,
        }),
        fetchProductCards({
          where: and(eq(products.status, "active"), gt(products.discountPercent, 0)),
          orderBy: desc(products.discountPercent),
          limit: 10,
        }),
        fetchProductCards({
          where: eq(products.status, "active"),
          orderBy: desc(products.totalSold),
          limit: 10,
        }),
      ]);

    return NextResponse.json({
      banners: activeBanners,
      categories: activeCategories,
      promotions: activePromotions.map((p) => ({
        ...p,
        discountValue: parseFloat(String(p.discountValue)),
      })),
      featuredProducts: featured,
      newProducts: fresh,
      discountedProducts: discounted,
      popularProducts: popular,
    });
  } catch (error) {
    console.error("Customer home error:", error);
    return NextResponse.json({ error: "Bosh sahifa ma'lumotlarini yuklashda xatolik" }, { status: 500 });
  }
}
