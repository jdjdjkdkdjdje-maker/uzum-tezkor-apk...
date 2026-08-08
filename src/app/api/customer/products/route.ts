import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, categories, brands, searchHistory, promotionProducts } from "@/db/schema";
import { sql, eq, and, or, ilike, desc, asc, gt, inArray } from "drizzle-orm";
import { fetchProductCards, countProducts } from "@/lib/customer-products";
import { getCustomer } from "@/lib/customer-auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(40, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
    const search = (searchParams.get("search") ?? "").trim();
    const categoryId = searchParams.get("categoryId");
    const brandId = searchParams.get("brandId");
    const promotionId = searchParams.get("promotionId");
    const filter = searchParams.get("filter"); // featured | new | discounted
    const sort = searchParams.get("sort") ?? "popular";
    const offset = (page - 1) * limit;

    const conditions = [eq(products.status, "active")];

    if (search) {
      // Mahsulot nomi, brend va kategoriya bo'yicha qidiruv
      const matchingBrands = await db
        .select({ id: brands.id })
        .from(brands)
        .where(ilike(brands.name, `%${search}%`));
      const matchingCategories = await db
        .select({ id: categories.id })
        .from(categories)
        .where(ilike(categories.name, `%${search}%`));

      const searchConds = [
        ilike(products.name, `%${search}%`),
        ilike(products.nameRu, `%${search}%`),
      ];
      if (matchingBrands.length > 0) {
        searchConds.push(inArray(products.brandId, matchingBrands.map((b) => b.id)));
      }
      if (matchingCategories.length > 0) {
        searchConds.push(inArray(products.categoryId, matchingCategories.map((c) => c.id)));
      }
      conditions.push(or(...searchConds)!);
    }

    if (categoryId) {
      const catId = parseInt(categoryId);
      // Ichki kategoriyalarni ham qamrab olish
      const children = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.parentId, catId));
      const ids = [catId, ...children.map((c) => c.id)];
      conditions.push(inArray(products.categoryId, ids));
    }
    if (brandId) conditions.push(eq(products.brandId, parseInt(brandId)));
    if (promotionId) {
      const promoProducts = await db
        .select({ productId: promotionProducts.productId })
        .from(promotionProducts)
        .where(eq(promotionProducts.promotionId, parseInt(promotionId)));
      conditions.push(
        promoProducts.length > 0
          ? inArray(products.id, promoProducts.map((p) => p.productId))
          : sql`false`
      );
    }
    if (filter === "featured") conditions.push(eq(products.isFeatured, true));
    if (filter === "new") conditions.push(eq(products.isNew, true));
    if (filter === "discounted") conditions.push(gt(products.discountPercent, 0));

    const where = and(...conditions);

    let orderBy;
    switch (sort) {
      case "newest": orderBy = desc(products.createdAt); break;
      case "price_asc": orderBy = asc(products.price); break;
      case "price_desc": orderBy = desc(products.price); break;
      case "rating": orderBy = desc(products.averageRating); break;
      case "discount": orderBy = desc(products.discountPercent); break;
      default: orderBy = desc(products.totalSold);
    }

    const [items, total] = await Promise.all([
      fetchProductCards({ where, orderBy, limit, offset }),
      countProducts(where),
    ]);

    // Qidiruv tarixini saqlash (faqat birinchi sahifada)
    if (search && page === 1) {
      const user = await getCustomer();
      if (user) {
        await db.insert(searchHistory).values({
          userId: user.id,
          query: search.slice(0, 300),
          resultsCount: total,
        });
      }
    }

    return NextResponse.json({
      products: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Customer products error:", error);
    return NextResponse.json({ error: "Mahsulotlarni yuklashda xatolik" }, { status: 500 });
  }
}
