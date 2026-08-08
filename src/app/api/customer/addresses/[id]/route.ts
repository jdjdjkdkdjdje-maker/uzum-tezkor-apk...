import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { addresses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCustomer, unauthorized } from "@/lib/customer-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCustomer();
    if (!user) return unauthorized();

    const { id } = await params;
    const addressId = parseInt(id);

    const [existing] = await db
      .select()
      .from(addresses)
      .where(and(eq(addresses.id, addressId), eq(addresses.userId, user.id)))
      .limit(1);
    if (!existing) {
      return NextResponse.json({ error: "Manzil topilmadi" }, { status: 404 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof body.title === "string") updates.title = body.title.trim();
    if (typeof body.fullAddress === "string") updates.fullAddress = body.fullAddress.trim();
    if ("apartment" in body) updates.apartment = body.apartment ? String(body.apartment) : null;
    if ("entrance" in body) updates.entrance = body.entrance ? String(body.entrance) : null;
    if ("floor" in body) updates.floor = body.floor ? String(body.floor) : null;
    if ("latitude" in body) updates.latitude = body.latitude ? parseFloat(String(body.latitude)) : null;
    if ("longitude" in body) updates.longitude = body.longitude ? parseFloat(String(body.longitude)) : null;

    if (body.isDefault === true) {
      await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, user.id));
      updates.isDefault = true;
    }

    const [updated] = await db
      .update(addresses)
      .set(updates)
      .where(and(eq(addresses.id, addressId), eq(addresses.userId, user.id)))
      .returning();

    return NextResponse.json({ address: updated });
  } catch (error) {
    console.error("Address PATCH error:", error);
    return NextResponse.json({ error: "Manzilni yangilashda xatolik" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCustomer();
    if (!user) return unauthorized();

    const { id } = await params;
    const addressId = parseInt(id);

    await db
      .delete(addresses)
      .where(and(eq(addresses.id, addressId), eq(addresses.userId, user.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Address DELETE error:", error);
    return NextResponse.json({ error: "Manzilni o'chirishda xatolik" }, { status: 500 });
  }
}
