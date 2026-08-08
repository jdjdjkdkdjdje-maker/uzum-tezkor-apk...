import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { addresses } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getCustomer, unauthorized } from "@/lib/customer-auth";

export async function GET() {
  try {
    const user = await getCustomer();
    if (!user) return unauthorized();

    const rows = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, user.id))
      .orderBy(desc(addresses.isDefault), desc(addresses.createdAt));

    return NextResponse.json({ addresses: rows });
  } catch (error) {
    console.error("Addresses GET error:", error);
    return NextResponse.json({ error: "Manzillarni yuklashda xatolik" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCustomer();
    if (!user) return unauthorized();

    const body = await request.json();
    const title = String(body.title ?? "").trim() || "Mening manzilim";
    const fullAddress = String(body.fullAddress ?? "").trim();
    if (!fullAddress) {
      return NextResponse.json({ error: "Manzilni to'liq kiriting" }, { status: 400 });
    }

    const makeDefault = Boolean(body.isDefault);
    if (makeDefault) {
      await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, user.id));
    }

    const existing = await db
      .select({ id: addresses.id })
      .from(addresses)
      .where(eq(addresses.userId, user.id));

    const [created] = await db
      .insert(addresses)
      .values({
        userId: user.id,
        title,
        fullAddress,
        apartment: body.apartment ? String(body.apartment) : null,
        entrance: body.entrance ? String(body.entrance) : null,
        floor: body.floor ? String(body.floor) : null,
        latitude: body.latitude ? parseFloat(String(body.latitude)) : null,
        longitude: body.longitude ? parseFloat(String(body.longitude)) : null,
        isDefault: makeDefault || existing.length === 0,
      })
      .returning();

    return NextResponse.json({ address: created }, { status: 201 });
  } catch (error) {
    console.error("Addresses POST error:", error);
    return NextResponse.json({ error: "Manzil qo'shishda xatolik" }, { status: 500 });
  }
}
