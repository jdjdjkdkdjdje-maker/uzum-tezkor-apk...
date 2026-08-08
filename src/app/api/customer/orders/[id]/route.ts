import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  orders, orderItems, orderStatusHistory, inventory, inventoryTransactions, products, notifications,
} from "@/db/schema";
import { sql, eq, and, asc } from "drizzle-orm";
import { getCustomer, unauthorized } from "@/lib/customer-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCustomer();
    if (!user) return unauthorized();

    const { id } = await params;
    const orderId = parseInt(id);

    // Mijoz faqat o'z buyurtmasini ko'ra oladi
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, user.id)))
      .limit(1);
    if (!order) {
      return NextResponse.json({ error: "Buyurtma topilmadi" }, { status: 404 });
    }

    const [items, history] = await Promise.all([
      db.select().from(orderItems).where(eq(orderItems.orderId, orderId)),
      db
        .select()
        .from(orderStatusHistory)
        .where(eq(orderStatusHistory.orderId, orderId))
        .orderBy(asc(orderStatusHistory.createdAt)),
    ]);

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        subtotal: parseFloat(String(order.subtotal)),
        deliveryFee: parseFloat(String(order.deliveryFee)),
        discountAmount: parseFloat(String(order.discountAmount)),
        couponDiscount: order.couponDiscount ? parseFloat(String(order.couponDiscount)) : 0,
        totalAmount: parseFloat(String(order.totalAmount)),
        deliveryAddress: order.deliveryAddress,
        estimatedDeliveryAt: order.estimatedDeliveryAt,
        deliveredAt: order.deliveredAt,
        cancelledAt: order.cancelledAt,
        cancelReason: order.cancelReason,
        notes: order.notes,
        createdAt: order.createdAt,
        items: items.map((it) => ({
          id: it.id,
          productId: it.productId,
          productName: it.productName,
          productImage: it.productImage,
          quantity: it.quantity,
          unitPrice: parseFloat(String(it.unitPrice)),
          totalPrice: parseFloat(String(it.totalPrice)),
        })),
        statusHistory: history.map((h) => ({
          status: h.status,
          comment: h.comment,
          createdAt: h.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Customer order detail error:", error);
    return NextResponse.json({ error: "Buyurtmani yuklashda xatolik" }, { status: 500 });
  }
}

// Buyurtmani bekor qilish (faqat pending/confirmed holatida)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCustomer();
    if (!user) return unauthorized();

    const { id } = await params;
    const orderId = parseInt(id);
    const body = await request.json().catch(() => ({}));

    if (body.action !== "cancel") {
      return NextResponse.json({ error: "Noto'g'ri so'rov" }, { status: 400 });
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, user.id)))
      .limit(1);
    if (!order) {
      return NextResponse.json({ error: "Buyurtma topilmadi" }, { status: 404 });
    }
    if (order.status !== "pending" && order.status !== "confirmed") {
      return NextResponse.json(
        { error: "Bu bosqichda buyurtmani bekor qilib bo'lmaydi" },
        { status: 400 }
      );
    }

    await db.transaction(async (tx) => {
      await tx
        .update(orders)
        .set({
          status: "cancelled",
          cancelledAt: new Date(),
          cancelReason: body.reason ? String(body.reason) : "Mijoz tomonidan bekor qilindi",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      await tx.insert(orderStatusHistory).values({
        orderId,
        status: "cancelled",
        comment: body.reason ? String(body.reason) : "Mijoz tomonidan bekor qilindi",
        changedBy: user.id,
      });

      // Ombordagi qoldiqni qaytarish
      const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
      for (const it of items) {
        const stockRows = await tx.execute(
          sql`SELECT quantity FROM inventory WHERE product_id = ${it.productId}`
        );
        const prevQty = (stockRows.rows[0] as { quantity: number } | undefined)?.quantity ?? 0;

        await tx
          .update(inventory)
          .set({ quantity: sql`${inventory.quantity} + ${it.quantity}`, updatedAt: new Date() })
          .where(eq(inventory.productId, it.productId));

        await tx.insert(inventoryTransactions).values({
          productId: it.productId,
          type: "return",
          quantity: it.quantity,
          previousQuantity: prevQty,
          newQuantity: prevQty + it.quantity,
          reason: "Buyurtma bekor qilindi",
          reference: order.orderNumber,
        });

        await tx
          .update(products)
          .set({ totalSold: sql`GREATEST(${products.totalSold} - ${it.quantity}, 0)` })
          .where(eq(products.id, it.productId));
      }

      await tx.insert(notifications).values({
        userId: user.id,
        title: "Buyurtma bekor qilindi",
        body: `№${order.orderNumber} raqamli buyurtmangiz bekor qilindi.`,
        type: "order",
        data: { orderId: order.id, orderNumber: order.orderNumber },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Customer order cancel error:", error);
    return NextResponse.json({ error: "Buyurtmani bekor qilishda xatolik" }, { status: 500 });
  }
}
