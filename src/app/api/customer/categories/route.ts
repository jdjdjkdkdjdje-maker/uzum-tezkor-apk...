import { NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { sql, eq, and, asc } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db
      .select({
        id: categories.id,
        parentId: categories.parentId,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        image: categories.image,
        icon: categories.icon,
        color: categories.color,
        productCount: sql<number>`(SELECT count(*)::int FROM products p WHERE p.category_id = ${categories.id} AND p.status = 'active')`,
      })
      .from(categories)
      .where(and(eq(categories.isActive, true)))
      .orderBy(asc(categories.sortOrder));

    return NextResponse.json({ categories: rows });
  } catch (error) {
    console.error("Customer categories error:", error);
    return NextResponse.json({ error: "Kategoriyalarni yuklashda xatolik" }, { status: 500 });
  }
}
