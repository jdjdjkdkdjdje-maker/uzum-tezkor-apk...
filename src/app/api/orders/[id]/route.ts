import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, users, products, orderStatusHistory, notifications } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);

    const orderData = await db.execute(sql`
      SELECT 
        o.*,
        o.total_amount::float as total_amount,
        o.subtotal::float as subtotal,
        o.delivery_fee::float as delivery_fee,
        o.discount_amount::float as discount_amount,
        u.first_name, u.last_name, u.phone, u.email, u.avatar
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ${orderId}
    `);

    if (!orderData.rows[0]) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const itemsData = await db.execute(sql`
      SELECT 
        oi.*,
        oi.unit_price::float,
        oi.total_price::float,
        p.barcode, p.weight, p.weight_unit
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ${orderId}
    `);

    const historyData = await db
      .select({
        id: orderStatusHistory.id,
        status: orderStatusHistory.status,
        comment: orderStatusHistory.comment,
        createdAt: orderStatusHistory.createdAt,
      })
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, orderId))
      .orderBy(orderStatusHistory.createdAt);

    return NextResponse.json({
      order: orderData.rows[0],
      items: itemsData.rows,
      history: historyData,
    });
  } catch (error) {
    console.error("Order GET error:", error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);
    const body = await request.json();
    const { status, comment } = body;

    const [updated] = await db
      .update(orders)
      .set({
        status: status,
        updatedAt: new Date(),
        ...(status === "delivered" ? { deliveredAt: new Date() } : {}),
        ...(status === "cancelled" ? { cancelledAt: new Date(), cancelReason: comment } : {}),
      })
      .where(eq(orders.id, orderId))
      .returning();

    if (status) {
      await db.insert(orderStatusHistory).values({
        orderId,
        status,
        comment,
      });

      // Mijozga status o'zgarishi haqida bildirishnoma (mijozlar ilovasi uchun)
      if (updated?.userId) {
        const statusLabels: Record<string, string> = {
          pending: "kutilmoqda",
          confirmed: "tasdiqlandi",
          preparing: "tayyorlanmoqda",
          ready: "tayyor",
          picked_up: "kuryerga topshirildi",
          delivering: "yetkazilmoqda",
          delivered: "yetkazib berildi",
          cancelled: "bekor qilindi",
          returned: "qaytarildi",
        };
        try {
          await db.insert(notifications).values({
            userId: updated.userId,
            title: "Buyurtma holati yangilandi",
            body: `№${updated.orderNumber} raqamli buyurtmangiz ${statusLabels[status] ?? status}.`,
            type: "order",
            data: { orderId: updated.id, orderNumber: updated.orderNumber, status },
          });
        } catch (notifyError) {
          console.error("Order notification error:", notifyError);
        }
      }
    }

    return NextResponse.json({ order: updated });
  } catch (error) {
    console.error("Order PUT error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
