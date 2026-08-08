"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart, Trash2, Minus, Plus, TicketPercent, X } from "lucide-react";
import { toast } from "sonner";
import { api, type CartData } from "@/lib/customer-api";
import { fmtSum } from "@/lib/customer-format";
import { useCustomerStore } from "@/components/customer/Store";
import BottomNav from "@/components/customer/BottomNav";
import { EmptyState, ErrorState, ListSkeleton, SafeImg } from "@/components/customer/Shared";

export default function CartPage() {
  const { user, loading: userLoading, setCartCount } = useCustomerStore();
  const [cart, setCart] = useState<CartData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyItem, setBusyItem] = useState<number | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; name: string; discount: number } | null>(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  const applyCart = useCallback(
    (c: CartData) => {
      setCart(c);
      setCartCount(c.count);
    },
    [setCartCount]
  );

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.get<{ cart: CartData }>("/api/customer/cart");
      applyCart(data.cart);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik yuz berdi");
    }
  }, [applyCart]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  // Kuponni qayta tekshirish (summa o'zgarsa)
  useEffect(() => {
    if (!coupon || !cart) return;
    (async () => {
      try {
        const res = await api.post<{ discount: number }>("/api/customer/coupons/validate", {
          code: coupon.code,
          subtotal: cart.subtotal,
        });
        setCoupon((c) => (c ? { ...c, discount: res.discount } : null));
      } catch {
        setCoupon(null);
        toast.error("Kupon endi amal qilmaydi");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart?.subtotal]);

  const updateQty = async (itemId: number, quantity: number) => {
    setBusyItem(itemId);
    try {
      const data = await api.patch<{ cart: CartData }>("/api/customer/cart", { itemId, quantity });
      applyCart(data.cart);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Xatolik yuz berdi");
    } finally {
      setBusyItem(null);
    }
  };

  const removeItem = async (itemId: number) => {
    setBusyItem(itemId);
    try {
      const data = await api.delete<{ cart: CartData }>(`/api/customer/cart?itemId=${itemId}`);
      applyCart(data.cart);
      toast.success("Mahsulot o'chirildi");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Xatolik yuz berdi");
    } finally {
      setBusyItem(null);
    }
  };

  const clearCart = async () => {
    if (!confirm("Savatchani butunlay tozalamoqchimisiz?")) return;
    try {
      const data = await api.delete<{ cart: CartData }>("/api/customer/cart");
      applyCart(data.cart);
      setCoupon(null);
      toast.success("Savatcha tozalandi");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Xatolik yuz berdi");
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim() || !cart) return;
    setCheckingCoupon(true);
    try {
      const res = await api.post<{
        coupon: { code: string; name: string };
        discount: number;
      }>("/api/customer/coupons/validate", {
        code: couponCode.trim(),
        subtotal: cart.subtotal,
      });
      setCoupon({ code: res.coupon.code, name: res.coupon.name, discount: res.discount });
      setCouponCode("");
      toast.success(`Kupon qo'llandi: ${res.coupon.name}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kupon xatosi");
    } finally {
      setCheckingCoupon(false);
    }
  };

  const couponDiscount = coupon?.discount ?? 0;
  const finalTotal = cart ? cart.subtotal - couponDiscount + cart.deliveryFee : 0;

  return (
    <div className="pb-24">
      <header className="sticky top-0 z-30 flex items-center justify-between bg-gray-50/95 px-4 py-4 backdrop-blur-md">
        <h1 className="text-xl font-extrabold text-gray-900">Savatcha</h1>
        {cart && cart.items.length > 0 && (
          <button
            type="button"
            onClick={clearCart}
            className="flex items-center gap-1 text-xs font-semibold text-red-500"
          >
            <Trash2 size={14} /> Tozalash
          </button>
        )}
      </header>

      {!userLoading && !user ? (
        <EmptyState
          icon={<ShoppingCart size={36} />}
          title="Tizimga kiring"
          subtitle="Savatchangizni ko'rish uchun tizimga kiring"
          actionLabel="Kirish"
          actionHref="/customer/login?next=/customer/cart"
        />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !cart ? (
        <ListSkeleton />
      ) : cart.items.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart size={36} />}
          title="Savatcha bo'sh"
          subtitle="Mahsulotlarni tanlab, savatchaga qo'shing"
          actionLabel="Xarid qilish"
          actionHref="/customer/home"
        />
      ) : (
        <div className="px-4">
          {/* Mahsulotlar */}
          <div className="space-y-3">
            {cart.items.map((item) => (
              <div
                key={item.id}
                className={`flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-gray-100 ${
                  busyItem === item.id ? "opacity-60" : ""
                }`}
              >
                <Link
                  href={`/customer/products/${item.productId}`}
                  className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-50"
                >
                  <SafeImg src={item.image} alt={item.name} className="h-full w-full object-cover" iconSize={24} />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/customer/products/${item.productId}`}
                      className="line-clamp-2 text-sm font-semibold leading-4.5 text-gray-800"
                    >
                      {item.name}
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="shrink-0 text-gray-300 hover:text-red-500"
                    >
                      <X size={17} />
                    </button>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-400">{fmtSum(item.price)} / dona</p>
                  {!item.isActive && (
                    <p className="text-[11px] font-semibold text-red-500">Hozircha mavjud emas</p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2.5 rounded-xl bg-gray-100 p-0.5">
                      <button
                        type="button"
                        disabled={busyItem === item.id}
                        onClick={() => updateQty(item.id, item.quantity - 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-sm active:scale-90"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-5 text-center text-sm font-bold">{item.quantity}</span>
                      <button
                        type="button"
                        disabled={busyItem === item.id}
                        onClick={() => {
                          if (item.quantity >= item.available) {
                            toast.error(`Omborda faqat ${item.available} dona qolgan`);
                            return;
                          }
                          updateQty(item.id, item.quantity + 1);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-sm active:scale-90"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="text-sm font-extrabold text-gray-900">
                      {fmtSum(item.lineTotal)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Kupon */}
          <div className="mt-4 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-gray-100">
            {coupon ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TicketPercent size={18} className="text-green-600" />
                  <div>
                    <p className="text-sm font-bold text-gray-800">{coupon.code}</p>
                    <p className="text-xs text-green-600">-{fmtSum(coupon.discount)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCoupon(null)}
                  className="text-xs font-semibold text-red-500"
                >
                  Olib tashlash
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <TicketPercent
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Kupon kodi"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm uppercase outline-none focus:border-green-500"
                  />
                </div>
                <button
                  type="button"
                  disabled={checkingCoupon || !couponCode.trim()}
                  onClick={applyCoupon}
                  className="rounded-xl bg-green-600 px-4 text-sm font-bold text-white active:scale-95 disabled:opacity-50"
                >
                  {checkingCoupon ? "..." : "Qo'llash"}
                </button>
              </div>
            )}
          </div>

          {/* Hisob */}
          <div className="mt-4 space-y-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Mahsulotlar ({cart.count} dona)</span>
              <span className="font-semibold text-gray-800">{fmtSum(cart.subtotal)}</span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Kupon chegirmasi</span>
                <span className="font-semibold">-{fmtSum(couponDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-500">
              <span>Yetkazib berish</span>
              <span className="font-semibold text-gray-800">
                {cart.deliveryFee === 0 ? "Bepul 🎉" : fmtSum(cart.deliveryFee)}
              </span>
            </div>
            {cart.deliveryFee > 0 && (
              <p className="rounded-xl bg-green-50 px-3 py-2 text-xs text-green-700">
                {fmtSum(cart.freeDeliveryThreshold - cart.subtotal)} lik xarid qo&apos;shsangiz —
                yetkazib berish bepul!
              </p>
            )}
            <div className="border-t border-dashed border-gray-200 pt-2.5">
              <div className="flex justify-between text-base">
                <span className="font-bold text-gray-900">Jami</span>
                <span className="font-extrabold text-green-600">{fmtSum(finalTotal)}</span>
              </div>
            </div>
          </div>

          {cart.subtotal < cart.minOrderAmount && (
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2.5 text-xs font-medium text-amber-700">
              Minimal buyurtma summasi — {fmtSum(cart.minOrderAmount)}. Yana{" "}
              {fmtSum(cart.minOrderAmount - cart.subtotal)} lik mahsulot qo&apos;shing.
            </p>
          )}

          <Link
            href={
              cart.subtotal >= cart.minOrderAmount
                ? `/customer/checkout${coupon ? `?coupon=${encodeURIComponent(coupon.code)}` : ""}`
                : "#"
            }
            aria-disabled={cart.subtotal < cart.minOrderAmount}
            className={`mt-4 block w-full rounded-2xl py-4 text-center text-base font-bold transition active:scale-[0.98] ${
              cart.subtotal >= cart.minOrderAmount
                ? "bg-green-600 text-white shadow-lg shadow-green-600/30"
                : "pointer-events-none bg-gray-200 text-gray-400"
            }`}
          >
            Rasmiylashtirish — {fmtSum(finalTotal)}
          </Link>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
