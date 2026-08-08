"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MapPin, Truck, Wallet, CreditCard, Banknote, Plus, Check, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { api, type Address, type CartData } from "@/lib/customer-api";
import { fmtSum } from "@/lib/customer-format";
import { useCustomerStore } from "@/components/customer/Store";
import { TopBar, ListSkeleton, ErrorState } from "@/components/customer/Shared";

const REGIONS = [
  "Toshkent shahri", "Toshkent viloyati", "Andijon", "Buxoro", "Farg'ona",
  "Jizzax", "Xorazm", "Namangan", "Navoiy", "Qashqadaryo", "Qoraqalpog'iston",
  "Samarqand", "Sirdaryo", "Surxondaryo",
];

// Mavjud tizimda faqat shu to'lov usullari real ishlaydi:
// naqd pul va kartada (yetkazib berilganda) to'lash.
const PAYMENT_METHODS = [
  {
    value: "cash",
    label: "Naqd pul",
    desc: "Yetkazib berilganda naqd to'laysiz",
    icon: Banknote,
  },
  {
    value: "card",
    label: "Bank kartasi",
    desc: "Yetkazib berilganda karta orqali to'laysiz",
    icon: CreditCard,
  },
] as const;

function CheckoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const couponCode = searchParams.get("coupon") ?? "";
  const { user, loading: userLoading, setCartCount } = useCustomerStore();

  const [cart, setCart] = useState<CartData | null>(null);
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    contactName: "",
    contactPhone: "",
    region: "Toshkent shahri",
    city: "",
    street: "",
    house: "",
    apartment: "",
    note: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [cartRes, addrRes] = await Promise.all([
        api.get<{ cart: CartData }>("/api/customer/cart"),
        api.get<{ addresses: Address[] }>("/api/customer/addresses"),
      ]);
      setCart(cartRes.cart);
      setAddresses(addrRes.addresses);
      const def = addrRes.addresses.find((a) => a.isDefault) ?? addrRes.addresses[0];
      if (def) setSelectedAddressId(def.id);
      else setShowNewAddress(true);

      if (couponCode && cartRes.cart.subtotal > 0) {
        try {
          const c = await api.post<{ discount: number }>("/api/customer/coupons/validate", {
            code: couponCode,
            subtotal: cartRes.cart.subtotal,
          });
          setCouponDiscount(c.discount);
        } catch {
          setCouponDiscount(0);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik yuz berdi");
    }
  }, [couponCode]);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.replace("/customer/login?next=/customer/checkout");
      return;
    }
    setNewAddress((f) => ({
      ...f,
      contactName: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
      contactPhone: user.phone,
    }));
    load();
  }, [user, userLoading, router, load]);

  const submit = async () => {
    if (!cart || cart.items.length === 0) {
      toast.error("Savatchangiz bo'sh");
      return;
    }

    let addressId: number | null = selectedAddressId;

    setSubmitting(true);
    try {
      // Yangi manzil kiritilgan bo'lsa — avval saqlaymiz
      if (showNewAddress) {
        if (!newAddress.contactName.trim() || !newAddress.contactPhone.trim()) {
          toast.error("Ism va telefon raqamini kiriting");
          setSubmitting(false);
          return;
        }
        if (!newAddress.city.trim() || !newAddress.street.trim() || !newAddress.house.trim()) {
          toast.error("Shahar, ko'cha va uy raqamini kiriting");
          setSubmitting(false);
          return;
        }
        const fullAddress = [
          newAddress.region,
          newAddress.city.trim(),
          newAddress.street.trim(),
          `uy ${newAddress.house.trim()}`,
          newAddress.note.trim() && `(${newAddress.note.trim()})`,
          `Qabul qiluvchi: ${newAddress.contactName.trim()}, ${newAddress.contactPhone.trim()}`,
        ]
          .filter(Boolean)
          .join(", ");

        const created = await api.post<{ address: Address }>("/api/customer/addresses", {
          title: "Yetkazib berish manzili",
          fullAddress,
          apartment: newAddress.apartment.trim() || undefined,
          isDefault: (addresses?.length ?? 0) === 0,
        });
        addressId = created.address.id;
      }

      if (!addressId) {
        toast.error("Yetkazib berish manzilini tanlang");
        setSubmitting(false);
        return;
      }

      const res = await api.post<{ order: { id: number } }>("/api/customer/orders", {
        addressId,
        paymentMethod,
        couponCode: couponDiscount > 0 ? couponCode : undefined,
        notes: notes.trim() || undefined,
      });

      setCartCount(0);
      router.replace(`/customer/order-success/${res.order.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Buyurtma berishda xatolik");
      setSubmitting(false);
    }
  };

  const total = cart ? cart.subtotal - couponDiscount + cart.deliveryFee : 0;
  const inputCls =
    "w-full rounded-xl border border-gray-200 bg-gray-50 py-3 px-3.5 text-sm outline-none transition focus:border-green-500 focus:bg-white";

  return (
    <div className="pb-40">
      <TopBar title="Rasmiylashtirish" backHref="/customer/cart" />

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !cart || !addresses ? (
        <ListSkeleton />
      ) : (
        <div className="space-y-4 px-4 pt-3">
          {/* 1. Manzil */}
          <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-gray-900">
              <MapPin size={16} className="text-green-600" /> Yetkazib berish manzili
            </h2>

            {addresses.length > 0 && (
              <div className="mt-3 space-y-2">
                {addresses.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      setSelectedAddressId(a.id);
                      setShowNewAddress(false);
                    }}
                    className={`flex w-full items-start gap-2.5 rounded-xl border-2 p-3 text-left transition ${
                      selectedAddressId === a.id && !showNewAddress
                        ? "border-green-500 bg-green-50/50"
                        : "border-gray-100"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        selectedAddressId === a.id && !showNewAddress
                          ? "border-green-500 bg-green-500 text-white"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedAddressId === a.id && !showNewAddress && <Check size={12} />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-gray-800">{a.title}</span>
                      <span className="mt-0.5 block text-xs leading-4.5 text-gray-500">
                        {a.fullAddress}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowNewAddress((v) => !v)}
              className="mt-3 flex items-center gap-1.5 text-sm font-bold text-green-600"
            >
              <Plus size={16} /> Yangi manzil kiritish
            </button>

            {showNewAddress && (
              <div className="mt-3 space-y-2.5">
                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    placeholder="Ism *"
                    value={newAddress.contactName}
                    onChange={(e) => setNewAddress((f) => ({ ...f, contactName: e.target.value }))}
                    className={inputCls}
                  />
                  <input
                    type="tel"
                    placeholder="Telefon *"
                    value={newAddress.contactPhone}
                    onChange={(e) => setNewAddress((f) => ({ ...f, contactPhone: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setRegionOpen((v) => !v)}
                    className={`${inputCls} flex items-center justify-between text-left`}
                  >
                    {newAddress.region}
                    <ChevronDown size={16} className="text-gray-400" />
                  </button>
                  {regionOpen && (
                    <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl bg-white shadow-xl ring-1 ring-gray-100">
                      {REGIONS.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            setNewAddress((f) => ({ ...f, region: r }));
                            setRegionOpen(false);
                          }}
                          className={`block w-full px-3.5 py-2.5 text-left text-sm ${
                            newAddress.region === r
                              ? "bg-green-50 font-bold text-green-600"
                              : "text-gray-700"
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Shahar / tuman *"
                  value={newAddress.city}
                  onChange={(e) => setNewAddress((f) => ({ ...f, city: e.target.value }))}
                  className={inputCls}
                />
                <input
                  type="text"
                  placeholder="Ko'cha / mavze *"
                  value={newAddress.street}
                  onChange={(e) => setNewAddress((f) => ({ ...f, street: e.target.value }))}
                  className={inputCls}
                />
                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    placeholder="Uy *"
                    value={newAddress.house}
                    onChange={(e) => setNewAddress((f) => ({ ...f, house: e.target.value }))}
                    className={inputCls}
                  />
                  <input
                    type="text"
                    placeholder="Xonadon"
                    value={newAddress.apartment}
                    onChange={(e) => setNewAddress((f) => ({ ...f, apartment: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Qo'shimcha ma'lumot (mo'ljal va h.k.)"
                  value={newAddress.note}
                  onChange={(e) => setNewAddress((f) => ({ ...f, note: e.target.value }))}
                  className={inputCls}
                />
              </div>
            )}
          </section>

          {/* 2. Yetkazib berish usuli */}
          <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-gray-900">
              <Truck size={16} className="text-green-600" /> Yetkazib berish usuli
            </h2>
            <div className="mt-3 flex items-center justify-between rounded-xl border-2 border-green-500 bg-green-50/50 p-3">
              <div>
                <p className="text-sm font-bold text-gray-800">Kuryer orqali yetkazib berish</p>
                <p className="text-xs text-gray-500">Taxminan 90 daqiqa ichida</p>
              </div>
              <span className="text-sm font-bold text-green-600">
                {cart.deliveryFee === 0 ? "Bepul" : fmtSum(cart.deliveryFee)}
              </span>
            </div>
          </section>

          {/* 3. To'lov usuli */}
          <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-gray-900">
              <Wallet size={16} className="text-green-600" /> To&apos;lov usuli
            </h2>
            <div className="mt-3 space-y-2">
              {PAYMENT_METHODS.map((m) => {
                const Icon = m.icon;
                const active = paymentMethod === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setPaymentMethod(m.value)}
                    className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition ${
                      active ? "border-green-500 bg-green-50/50" : "border-gray-100"
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        active ? "bg-green-600 text-white" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <Icon size={20} />
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-bold text-gray-800">{m.label}</span>
                      <span className="block text-xs text-gray-500">{m.desc}</span>
                    </span>
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                        active ? "border-green-500 bg-green-500 text-white" : "border-gray-300"
                      }`}
                    >
                      {active && <Check size={12} />}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Izoh */}
          <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-sm font-extrabold text-gray-900">Buyurtmaga izoh</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Kuryer uchun qo'shimcha ma'lumot (ixtiyoriy)"
              rows={2}
              className="mt-2.5 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-green-500"
            />
          </section>

          {/* 4. Hisob */}
          <section className="space-y-2 rounded-2xl bg-white p-4 text-sm shadow-sm ring-1 ring-gray-100">
            <div className="flex justify-between text-gray-500">
              <span>Mahsulotlar ({cart.count} dona)</span>
              <span className="font-semibold text-gray-800">{fmtSum(cart.subtotal)}</span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Kupon ({couponCode})</span>
                <span className="font-semibold">-{fmtSum(couponDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-500">
              <span>Yetkazib berish</span>
              <span className="font-semibold text-gray-800">
                {cart.deliveryFee === 0 ? "Bepul" : fmtSum(cart.deliveryFee)}
              </span>
            </div>
            <div className="flex justify-between border-t border-dashed border-gray-200 pt-2.5 text-base">
              <span className="font-bold text-gray-900">Jami to&apos;lov</span>
              <span className="font-extrabold text-green-600">{fmtSum(total)}</span>
            </div>
          </section>
        </div>
      )}

      {/* Tasdiqlash paneli */}
      {cart && cart.items.length > 0 && (
        <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-gray-100 bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            disabled={submitting}
            onClick={submit}
            className="w-full rounded-2xl bg-green-600 py-4 text-base font-bold text-white shadow-lg shadow-green-600/30 transition active:scale-[0.98] disabled:opacity-60"
          >
            {submitting ? "Yuborilmoqda..." : `Buyurtmani tasdiqlash — ${fmtSum(total)}`}
          </button>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <CheckoutForm />
    </Suspense>
  );
}
