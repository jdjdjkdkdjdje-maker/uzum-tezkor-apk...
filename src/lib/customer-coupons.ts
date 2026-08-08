import { db } from "@/db";
import { coupons, couponUsage } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export type CouponResult =
  | { ok: true; coupon: typeof coupons.$inferSelect; discount: number }
  | { ok: false; error: string };

export async function validateCoupon(
  code: string,
  userId: number,
  subtotal: number
): Promise<CouponResult> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { ok: false, error: "Kupon kodini kiriting" };

  const [coupon] = await db
    .select()
    .from(coupons)
    .where(eq(coupons.code, normalized))
    .limit(1);

  if (!coupon) return { ok: false, error: "Bunday kupon topilmadi" };
  if (!coupon.isActive) return { ok: false, error: "Bu kupon faol emas" };

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    return { ok: false, error: "Bu kupon hali kuchga kirmagan" };
  }
  if (coupon.endsAt && coupon.endsAt < now) {
    return { ok: false, error: "Bu kuponning muddati tugagan" };
  }
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    return { ok: false, error: "Bu kupon limiti tugagan" };
  }

  if (coupon.usageLimitPerUser != null) {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(couponUsage)
      .where(and(eq(couponUsage.couponId, coupon.id), eq(couponUsage.userId, userId)));
    if ((row?.count ?? 0) >= coupon.usageLimitPerUser) {
      return { ok: false, error: "Siz bu kupondan allaqachon foydalangansiz" };
    }
  }

  const minAmount = coupon.minOrderAmount ? parseFloat(String(coupon.minOrderAmount)) : 0;
  if (subtotal < minAmount) {
    return {
      ok: false,
      error: `Bu kupon kamida ${minAmount.toLocaleString("uz-UZ").replace(/,/g, " ")} so'mlik buyurtma uchun amal qiladi`,
    };
  }

  const value = parseFloat(String(coupon.discountValue));
  let discount =
    coupon.discountType === "percentage" ? (subtotal * value) / 100 : value;
  const maxDiscount = coupon.maxDiscountAmount
    ? parseFloat(String(coupon.maxDiscountAmount))
    : null;
  if (maxDiscount != null && discount > maxDiscount) discount = maxDiscount;
  if (discount > subtotal) discount = subtotal;
  discount = Math.round(discount);

  return { ok: true, coupon, discount };
}
