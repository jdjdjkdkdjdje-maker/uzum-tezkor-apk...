import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { cartItems, products, productImages, inventory, settings } from "@/db/schema";
import { sql, eq, and, desc, asc, inArray } from "drizzle-orm";
import { getCustomer, unauthorized } from "@/lib/customer-auth";

async function getSettingsMap() {
  const rows = await db.select().from(settings);
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    deliveryFee: parseFloat(map.get("delivery.fee") ?? "15000") || 15000,
    freeThreshold: parseFloat(map.get("delivery.free_threshold") ?? "200000") || 200000,
    minOrderAmount: parseFloat(map.get("order.min_amount") ?? "30000") || 30000,
  };
}

async function buildCart(userId: number) {
  const rows = await db
    .select({
      id: cartItems.id,
      quantity: cartItems.quantity,
      productId: products.id,
      name: products.name,
      price: products.price,
      oldPrice: products.oldPrice,
      discountPercent: products.discountPercent,
      status: products.status,
      stockQty: inventory.quantity,
      reserved: inventory.reservedQuantity,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .leftJoin(inventory, eq(products.id, inventory.productId))
    .where(eq(cartItems.userId, userId))
    .orderBy(desc(cartItems.createdAt));

  const ids = rows.map((r) => r.productId);
  const imageMap = new Map<number, string>();
  if (ids.length > 0) {
    const imgs = await db
      .select({ productId: productImages.productId, url: productImages.url })
      .from(productImages)
      .where(inArray(productImages.productId, ids))
      .orderBy(desc(productImages.isPrimary), asc(productImages.sortOrder));
    for (const img of imgs) {
      if (!imageMap.has(img.productId)) imageMap.set(img.productId, img.url);
    }
  }

  const items = rows.map((r) => {
    const price = parseFloat(String(r.price));
    const available = Math.max(0, (r.stockQty ?? 0) - (r.reserved ?? 0));
    return {
      id: r.id,
      productId: r.productId,
      name: r.name,
      image: imageMap.get(r.productId) ?? null,
      price,
      oldPrice: r.oldPrice ? parseFloat(String(r.oldPrice)) : null,
      quantity: r.quantity,
      available,
      isActive: r.status === "active" && available > 0,
      lineTotal: price * r.quantity,
    };
  });

  const subtotal = items.filter((i) => i.isActive).reduce((s, i) => s + i.lineTotal, 0);
  const cfg = await getSettingsMap();
  const deliveryFee = subtotal >= cfg.freeThreshold || subtotal === 0 ? 0 : cfg.deliveryFee;

  return {
    items,
    subtotal,
    deliveryFee,
    freeDeliveryThreshold: cfg.freeThreshold,
    minOrderAmount: cfg.minOrderAmount,
    total: subtotal + deliveryFee,
    count: items.reduce((s, i) => s + i.quantity, 0),
  };
}

export async function GET() {
  try {
    const user = await getCustomer();
    if (!user) return unauthorized();
    return NextResponse.json({ cart: await buildCart(user.id) });
  } catch (error) {
    console.error("Cart GET error:", error);
    return NextResponse.json({ error: "Savatchani yuklashda xatolik" }, { status: 500 });
  }
}

// Savatchaga qo'shish
export async function POST(request: NextRequest) {
  try {
    const user = await getCustomer();
    if (!user) return unauthorized();

    const body = await request.json();
    const productId = parseInt(String(body.productId));
    const quantity = Math.max(1, parseInt(String(body.quantity ?? 1)));
    if (isNaN(productId)) {
      return NextResponse.json({ error: "Mahsulot tanlanmadi" }, { status: 400 });
    }

    const [prod] = await db
      .select({
        id: products.id,
        status: products.status,
        stockQty: inventory.quantity,
        reserved: inventory.reservedQuantity,
      })
      .from(products)
      .leftJoin(inventory, eq(products.id, inventory.productId))
      .where(eq(products.id, productId))
      .limit(1);

    if (!prod || prod.status !== "active") {
      return NextResponse.json({ error: "Bu mahsulot hozircha mavjud emas" }, { status: 400 });
    }
    const available = Math.max(0, (prod.stockQty ?? 0) - (prod.reserved ?? 0));
    if (available <= 0) {
      return NextResponse.json({ error: "Bu mahsulot omborda qolmagan" }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.userId, user.id), eq(cartItems.productId, productId)))
      .limit(1);

    const targetQty = (existing[0]?.quantity ?? 0) + quantity;
    if (targetQty > available) {
      return NextResponse.json(
        { error: `Omborda faqat ${available} dona qolgan`, available },
        { status: 400 }
      );
    }

    if (existing[0]) {
      await db
        .update(cartItems)
        .set({ quantity: targetQty, updatedAt: new Date() })
        .where(eq(cartItems.id, existing[0].id));
    } else {
      await db.insert(cartItems).values({ userId: user.id, productId, quantity });
    }

    return NextResponse.json({ cart: await buildCart(user.id) }, { status: 201 });
  } catch (error) {
    console.error("Cart POST error:", error);
    return NextResponse.json({ error: "Savatchaga qo'shishda xatolik" }, { status: 500 });
  }
}

// Miqdorni o'zgartirish
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCustomer();
    if (!user) return unauthorized();

    const body = await request.json();
    const itemId = parseInt(String(body.itemId));
    const quantity = parseInt(String(body.quantity));
    if (isNaN(itemId) || isNaN(quantity)) {
      return NextResponse.json({ error: "Noto'g'ri so'rov" }, { status: 400 });
    }

    const [item] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.id, itemId), eq(cartItems.userId, user.id)))
      .limit(1);
    if (!item) {
      return NextResponse.json({ error: "Savatcha elementi topilmadi" }, { status: 404 });
    }

    if (quantity <= 0) {
      await db.delete(cartItems).where(eq(cartItems.id, itemId));
    } else {
      const [stock] = await db
        .select({ quantity: inventory.quantity, reserved: inventory.reservedQuantity })
        .from(inventory)
        .where(eq(inventory.productId, item.productId))
        .limit(1);
      const available = Math.max(0, (stock?.quantity ?? 0) - (stock?.reserved ?? 0));
      if (quantity > available) {
        return NextResponse.json(
          { error: `Omborda faqat ${available} dona qolgan`, available },
          { status: 400 }
        );
      }
      await db
        .update(cartItems)
        .set({ quantity, updatedAt: new Date() })
        .where(eq(cartItems.id, itemId));
    }

    return NextResponse.json({ cart: await buildCart(user.id) });
  } catch (error) {
    console.error("Cart PATCH error:", error);
    return NextResponse.json({ error: "Savatchani yangilashda xatolik" }, { status: 500 });
  }
}

// O'chirish: ?itemId=N — bitta element, aks holda butun savat
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCustomer();
    if (!user) return unauthorized();

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    if (itemId) {
      await db
        .delete(cartItems)
        .where(and(eq(cartItems.id, parseInt(itemId)), eq(cartItems.userId, user.id)));
    } else {
      await db.delete(cartItems).where(eq(cartItems.userId, user.id));
    }

    return NextResponse.json({ cart: await buildCart(user.id) });
  } catch (error) {
    console.error("Cart DELETE error:", error);
    return NextResponse.json({ error: "Savatchadan o'chirishda xatolik" }, { status: 500 });
  }
}
