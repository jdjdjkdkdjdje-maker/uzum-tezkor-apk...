import { db } from "@/db";
import { products, productImages, categories, brands, inventory } from "@/db/schema";
import { sql, eq, and, desc, asc, SQL } from "drizzle-orm";

export type ProductCard = {
  id: number;
  name: string;
  slug: string;
  price: number;
  oldPrice: number | null;
  discountPercent: number | null;
  status: string;
  isFeatured: boolean;
  isNew: boolean;
  averageRating: number | null;
  reviewCount: number;
  totalSold: number;
  categoryId: number | null;
  brandId: number | null;
  categoryName: string | null;
  brandName: string | null;
  available: number;
  image: string | null;
};

export async function fetchProductCards(options: {
  where?: SQL;
  orderBy?: SQL | ReturnType<typeof desc> | ReturnType<typeof asc>;
  limit?: number;
  offset?: number;
}): Promise<ProductCard[]> {
  const { where, orderBy, limit = 10, offset = 0 } = options;

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      oldPrice: products.oldPrice,
      discountPercent: products.discountPercent,
      status: products.status,
      isFeatured: products.isFeatured,
      isNew: products.isNew,
      averageRating: products.averageRating,
      reviewCount: products.reviewCount,
      totalSold: products.totalSold,
      categoryId: products.categoryId,
      brandId: products.brandId,
      categoryName: categories.name,
      brandName: brands.name,
      quantity: inventory.quantity,
      reserved: inventory.reservedQuantity,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(brands, eq(products.brandId, brands.id))
    .leftJoin(inventory, eq(products.id, inventory.productId))
    .where(where)
    .orderBy(orderBy ?? desc(products.createdAt))
    .limit(limit)
    .offset(offset);

  const ids = rows.map((r) => r.id);
  const imageMap = new Map<number, string>();
  if (ids.length > 0) {
    const imgs = await db
      .select({
        productId: productImages.productId,
        url: productImages.url,
        isPrimary: productImages.isPrimary,
        sortOrder: productImages.sortOrder,
      })
      .from(productImages)
      .where(sql`${productImages.productId} IN (${sql.join(ids.map((id) => sql`${id}`), sql`, `)})`)
      .orderBy(desc(productImages.isPrimary), asc(productImages.sortOrder));
    for (const img of imgs) {
      if (!imageMap.has(img.productId)) imageMap.set(img.productId, img.url);
    }
  }

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    price: parseFloat(String(r.price)),
    oldPrice: r.oldPrice ? parseFloat(String(r.oldPrice)) : null,
    discountPercent: r.discountPercent,
    status: r.status,
    isFeatured: r.isFeatured,
    isNew: r.isNew,
    averageRating: r.averageRating,
    reviewCount: r.reviewCount,
    totalSold: r.totalSold,
    categoryId: r.categoryId,
    brandId: r.brandId,
    categoryName: r.categoryName,
    brandName: r.brandName,
    available: Math.max(0, (r.quantity ?? 0) - (r.reserved ?? 0)),
    image: imageMap.get(r.id) ?? null,
  }));
}

export const activeProductWhere = and(
  eq(products.status, "active"),
);

export async function countProducts(where?: SQL): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .leftJoin(inventory, eq(products.id, inventory.productId))
    .where(where);
  return row?.count ?? 0;
}
