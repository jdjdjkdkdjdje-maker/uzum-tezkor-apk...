import { NextRequest, NextResponse } from "next/server";
import { getCustomer, unauthorized } from "@/lib/customer-auth";
import { validateCoupon } from "@/lib/customer-coupons";

export async function POST(request: NextRequest) {
  try {
    const user = await getCustomer();
    if (!user) return unauthorized();

    const body = await request.json();
    const code = String(body.code ?? "");
    const subtotal = parseFloat(String(body.subtotal ?? 0)) || 0;

    const result = await validateCoupon(code, user.id, subtotal);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      coupon: {
        code: result.coupon.code,
        name: result.coupon.name,
        discountType: result.coupon.discountType,
        discountValue: parseFloat(String(result.coupon.discountValue)),
      },
      discount: result.discount,
    });
  } catch (error) {
    console.error("Coupon validate error:", error);
    return NextResponse.json({ error: "Kuponni tekshirishda xatolik" }, { status: 500 });
  }
}
