import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, users, orderItems, products } from "@/db/schema";
import { sql, eq, ilike, and, or, desc, gte, lte } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status");
    const paymentStatus = searchParams.get("paymentStatus");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const offset = (page - 1) * limit;

    const conditions = [];
    if (status) conditions.push(eq(orders.status, status as "pending" | "confirmed" | "preparing" | "ready" | "picked_up" | "delivering" | "delivered" | "cancelled" | "returned"));
    if (paymentStatus) conditions.push(eq(orders.paymentStatus, paymentStatus as "pending" | "paid" | "failed" | "refunded"));
    if (dateFrom) conditions.push(gte(orders.createdAt, new Date(dateFrom)));
    if (dateTo) conditions.push(lte(orders.createdAt, new Date(dateTo)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(whereClause);

    const rows = await db.execute(sql`
      SELECT 
        o.id,
        o.order_number,
        o.status,
        o.total_amount::float,
        o.subtotal::float,
        o.delivery_fee::float,
        o.discount_amount::float,
        o.payment_method,
        o.payment_status,
        o.delivery_address,
        o.created_at,
        o.estimated_delivery_at,
        o.delivered_at,
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.phone,
        u.avatar,
        (SELECT COUNT(*)::int FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ${status ? sql`WHERE o.status = ${status}` : sql``}
      ORDER BY o.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    return NextResponse.json({
      orders: rows.rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error("Orders GET error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
