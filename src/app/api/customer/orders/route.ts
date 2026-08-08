import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  orders, orderItems, orderStatusHistory, cartItems, products, productImages,
  inventory, inventoryTransactions, addresses, settings, notifications,
  couponUsage, coupons,
} from "@/db/schema";
import { sql, eq, and, desc, inArray } from "drizzle-orm";
import { getCustomer, unauthorized } from "@/lib/customer-auth";
import { validateCoupon } from "@/lib/customer-coupons";

const ALLOWED_PAYMENT_METHODS = ["cash", "card"] as const;

export async function GET(request: NextRequest) {
  try {
    const user = await getCustomer();
    if (!user) return unauthorized();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(30, Math.max(1, parseInt(searchParams.get("limit") ?? "10")));
    const offset = (page - 1) * limit;

    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(eq(orders.userId, user.id));

    const rows = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, user.id))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    const orderIds = rows.map((o) => o.id);
    let items: (typeof orderItems.$inferSelect)[] = [];
    if (orderIds.length > 0) {
      items = await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds));
    }
    const itemsByOrder = new Map<number, typeof items>();
    for (const it of items) {
      const list = itemsByOrder.get(it.orderId) ?? [];
      list.push(it);
      itemsByOrder.set(it.orderId, list);
    }

    return NextResponse.json({
      orders: rows.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        subtotal: parseFloat(String(o.subtotal)),
        deliveryFee: parseFloat(String(o.deliveryFee)),
        discountAmount: parseFloat(String(o.discountAmount)),
        couponDiscount: o.couponDiscount ? parseFloat(String(o.couponDiscount)) : 0,
        totalAmount: parseFloat(String(o.totalAmount)),
        deliveryAddress: o.deliveryAddress,
        createdAt: o.createdAt,
        deliveredAt: o.deliveredAt,
        items: (itemsByOrder.get(o.id) ?? []).map((it) => ({
          id: it.id,
          productId: it.productId,
          productName: it.productName,
          productImage: it.productImage,
          quantity: it.quantity,
          unitPrice: parseFloat(String(it.unitPrice)),
          totalPrice: parseFloat(String(it.totalPrice)),
        })),
      })),
      total: countRow?.count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((countRow?.count ?? 0) / limit),
    });
  } catch (error) {
    console.error("Customer orders GET error:", error);
    return NextResponse.json({ error: "Buyurtmalarni yuklashda xatolik" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCustomer();
    if (!user) return unauthorized();

    const body = await request.json();
    const paymentMethod = String(body.paymentMethod ?? "cash") as (typeof ALLOWED_PAYMENT_METHODS)[number];
    if (!ALLOWED_PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json({ error: "Bu to'lov usuli hozircha mavjud emas" }, { status: 400 });
    }

    // Manzil
    let addressId: number | null = null;
    let deliveryAddress = "";
    let deliveryLatitude: number | null = null;
    let deliveryLongitude: number | null = null;

    if (body.addressId) {
      const [addr] = await db
        .select()
        .from(addresses)
        .where(and(eq(addresses.id, parseInt(String(body.addressId))), eq(addresses.userId, user.id)))
        .limit(1);
      if (!addr) {
        return NextResponse.json({ error: "Tanlangan manzil topilmadi" }, { status: 400 });
      }
      addressId = addr.id;
      deliveryAddress = [addr.fullAddress, addr.apartment && `xonadon ${addr.apartment}`]
        .filter(Boolean)
        .join(", ");
      deliveryLatitude = addr.latitude;
      deliveryLongitude = addr.longitude;
    } else if (body.deliveryAddress) {
      deliveryAddress = String(body.deliveryAddress).trim();
    }

    if (!deliveryAddress) {
      return NextResponse.json({ error: "Yetkazib berish manzilini kiriting" }, { status: 400 });
    }

    // Savat
    const cart = await db
      .select({
        id: cartItems.id,
        quantity: cartItems.quantity,
        productId: products.id,
        name: products.name,
        price: products.price,
        status: products.status,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, user.id));

    if (cart.length === 0) {
      return NextResponse.json({ error: "Savatchangiz bo'sh" }, { status: 400 });
    }

    const inactive = cart.filter((c) => c.status !== "active");
    if (inactive.length > 0) {
      return NextResponse.json(
        { error: `"${inactive[0].name}" hozirda sotuvda emas. Uni savatchadan olib tashlang.` },
        { status: 400 }
      );
    }

    // Sozlamalar
    const settingRows = await db.select().from(settings);
    const settingMap = new Map(settingRows.map((r) => [r.key, r.value]));
    const deliveryFeeCfg = parseFloat(settingMap.get("delivery.fee") ?? "15000") || 15000;
    const freeThreshold = parseFloat(settingMap.get("delivery.free_threshold") ?? "200000") || 200000;
    const minOrderAmount = parseFloat(settingMap.get("order.min_amount") ?? "30000") || 30000;

    // Narxlar faqat serverdagi qiymatlardan hisoblanadi
    const subtotal = cart.reduce((s, c) => s + parseFloat(String(c.price)) * c.quantity, 0);
    if (subtotal < minOrderAmount) {
      return NextResponse.json(
        { error: `Minimal buyurtma summasi ${minOrderAmount.toLocaleString("uz-UZ").replace(/,/g, " ")} so'm` },
        { status: 400 }
      );
    }

    // Kupon
    let couponId: number | null = null;
    let couponDiscount = 0;
    if (body.couponCode) {
      const result = await validateCoupon(String(body.couponCode), user.id, subtotal);
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      couponId = result.coupon.id;
      couponDiscount = result.discount;
    }

    const deliveryFee = subtotal >= freeThreshold ? 0 : deliveryFeeCfg;
    const totalAmount = subtotal - couponDiscount + deliveryFee;

    // Tranzaksiya: ombor tekshiruvi + buyurtma yaratish
    const created = await db.transaction(async (tx) => {
      // Qoldiqni qulflab tekshirish
      for (const item of cart) {
        const stockRows = await tx.execute(
          sql`SELECT quantity, reserved_quantity FROM inventory WHERE product_id = ${item.productId} FOR UPDATE`
        );
        const stock = stockRows.rows[0] as { quantity: number; reserved_quantity: number } | undefined;
        const available = Math.max(0, (stock?.quantity ?? 0) - (stock?.reserved_quantity ?? 0));
        if (item.quantity > available) {
          throw Object.assign(
            new Error(
              available <= 0
                ? `"${item.name}" omborda qolmagan`
                : `"${item.name}" mahsulotidan omborda faqat ${available} dona qolgan`
            ),
            { isStockError: true }
          );
        }
      }

      const orderNumber = `BM${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 900 + 100)}`;

      const [order] = await tx
        .insert(orders)
        .values({
          orderNumber,
          userId: user.id,
          addressId,
          status: "pending",
          subtotal: String(subtotal),
          deliveryFee: String(deliveryFee),
          discountAmount: String(couponDiscount),
          totalAmount: String(totalAmount),
          paymentMethod,
          paymentStatus: "pending",
          couponId,
          couponDiscount: String(couponDiscount),
          deliveryAddress,
          deliveryLatitude,
          deliveryLongitude,
          estimatedDeliveryAt: new Date(Date.now() + 90 * 60 * 1000),
          notes: body.notes ? String(body.notes) : null,
        })
        .returning();

      // Buyurtma elementlari + ombordan ayirish
      for (const item of cart) {
        const unitPrice = parseFloat(String(item.price));

        const [img] = await tx
          .select({ url: productImages.url })
          .from(productImages)
          .where(eq(productImages.productId, item.productId))
          .orderBy(desc(productImages.isPrimary))
          .limit(1);

        await tx.insert(orderItems).values({
          orderId: order.id,
          productId: item.productId,
          productName: item.name,
          productImage: img?.url ?? null,
          quantity: item.quantity,
          unitPrice: String(unitPrice),
          totalPrice: String(unitPrice * item.quantity),
          discountAmount: "0",
        });

        const stockRows = await tx.execute(
          sql`SELECT quantity FROM inventory WHERE product_id = ${item.productId}`
        );
        const prevQty = (stockRows.rows[0] as { quantity: number } | undefined)?.quantity ?? 0;

        await tx
          .update(inventory)
          .set({ quantity: sql`${inventory.quantity} - ${item.quantity}`, updatedAt: new Date() })
          .where(eq(inventory.productId, item.productId));

        await tx.insert(inventoryTransactions).values({
          productId: item.productId,
          type: "out",
          quantity: item.quantity,
          previousQuantity: prevQty,
          newQuantity: prevQty - item.quantity,
          reason: "Mijoz buyurtmasi",
          reference: orderNumber,
        });

        await tx
          .update(products)
          .set({ totalSold: sql`${products.totalSold} + ${item.quantity}` })
          .where(eq(products.id, item.productId));
      }

      await tx.insert(orderStatusHistory).values({
        orderId: order.id,
        status: "pending",
        comment: "Buyurtma qabul qilindi",
        changedBy: user.id,
      });

      if (couponId) {
        await tx.insert(couponUsage).values({ couponId, userId: user.id, orderId: order.id });
        await tx
          .update(coupons)
          .set({ usedCount: sql`${coupons.usedCount} + 1` })
          .where(eq(coupons.id, couponId));
      }

      await tx.insert(notifications).values({
        userId: user.id,
        title: "Buyurtmangiz qabul qilindi!",
        body: `№${orderNumber} raqamli buyurtmangiz qabul qilindi. Tez orada operatorlarimiz tasdiqlashadi.`,
        type: "order",
        data: { orderId: order.id, orderNumber },
      });

      // Savatni tozalash
      await tx.delete(cartItems).where(eq(cartItems.userId, user.id));

      return order;
    });

    return NextResponse.json(
      {
        order: {
          id: created.id,
          orderNumber: created.orderNumber,
          status: created.status,
          totalAmount: parseFloat(String(created.totalAmount)),
          deliveryAddress: created.deliveryAddress,
          createdAt: created.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error && typeof error === "object" && "isStockError" in error) {
      return NextResponse.json({ error: (error as unknown as Error).message }, { status: 400 });
    }
    console.error("Customer order create error:", error);
    return NextResponse.json({ error: "Buyurtma berishda xatolik yuz berdi" }, { status: 500 });
  }
}
