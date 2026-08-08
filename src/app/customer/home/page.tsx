"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Search, MapPin, ChevronRight, Percent } from "lucide-react";
import {
  api, type Banner, type Category, type ProductCard as ProductCardType,
  type Promotion, type Address,
} from "@/lib/customer-api";
import { greeting, fmtDate } from "@/lib/customer-format";
import { useCustomerStore } from "@/components/customer/Store";
import BottomNav from "@/components/customer/BottomNav";
import ProductCard from "@/components/customer/ProductCard";
import { HomeSkeleton, ErrorState, SafeImg } from "@/components/customer/Shared";

type HomeData = {
  banners: Banner[];
  categories: Category[];
  promotions: Promotion[];
  featuredProducts: ProductCardType[];
  newProducts: ProductCardType[];
  discountedProducts: ProductCardType[];
  popularProducts: ProductCardType[];
};

function Section({
  title, href, children,
}: { title: string; href?: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between px-4">
        <h2 className="text-[17px] font-extrabold text-gray-900">{title}</h2>
        {href && (
          <Link href={href} className="flex items-center gap-0.5 text-sm font-semibold text-green-600">
            Barchasi <ChevronRight size={16} />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function ProductRow({ products }: { products: ProductCardType[] }) {
  return (
    <div className="scrollbar-none flex gap-3 overflow-x-auto px-4 pb-1">
      {products.map((p) => (
        <div key={p.id} className="w-40 shrink-0">
          <ProductCard product={p} />
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const { user, unreadNotifications } = useCustomerStore();
  const [data, setData] = useState<HomeData | null>(null);
  const [defaultAddress, setDefaultAddress] = useState<Address | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bannerIndex, setBannerIndex] = useState(0);
  const bannerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const home = await api.get<HomeData>("/api/customer/home");
      setData(home);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik yuz berdi");
    }
    try {
      const res = await api.get<{ addresses: Address[] }>("/api/customer/addresses");
      setDefaultAddress(res.addresses.find((a) => a.isDefault) ?? res.addresses[0] ?? null);
    } catch {
      // manzil bo'lmasa muammo emas
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Banner avtomatik aylanishi
  useEffect(() => {
    if (!data || data.banners.length <= 1) return;
    const t = setInterval(() => {
      setBannerIndex((i) => {
        const next = (i + 1) % data.banners.length;
        const el = bannerRef.current;
        if (el) el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
        return next;
      });
    }, 4000);
    return () => clearInterval(t);
  }, [data]);

  return (
    <div className="pb-24">
      {/* Sarlavha */}
      <header className="sticky top-0 z-30 bg-gray-50/95 px-4 pb-2 pt-4 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs text-gray-500">{greeting()},</p>
            <h1 className="truncate text-lg font-extrabold text-gray-900">
              {user ? `${user.firstName ?? ""} 👋` : "Mehmon 👋"}
            </h1>
          </div>
          <Link
            href="/customer/notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-gray-100"
          >
            <Bell size={20} className="text-gray-700" />
            {unreadNotifications > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </span>
            )}
          </Link>
        </div>

        <Link href="/customer/addresses" className="mt-1.5 flex items-center gap-1 text-xs text-gray-500">
          <MapPin size={13} className="text-green-600" />
          <span className="truncate">
            {defaultAddress ? defaultAddress.fullAddress : "Yetkazib berish manzilini qo'shing"}
          </span>
          <ChevronRight size={13} />
        </Link>

        <Link
          href="/customer/search"
          className="mt-3 flex items-center gap-2.5 rounded-2xl bg-white px-4 py-3 text-sm text-gray-400 shadow-sm ring-1 ring-gray-100"
        >
          <Search size={18} />
          Mahsulot, brend yoki kategoriya qidirish...
        </Link>
      </header>

      {error && !data ? (
        <ErrorState message={error} onRetry={load} />
      ) : !data ? (
        <HomeSkeleton />
      ) : (
        <>
          {/* Bannerlar */}
          {data.banners.length > 0 && (
            <div className="mt-3">
              <div
                ref={bannerRef}
                className="scrollbar-none flex snap-x snap-mandatory gap-0 overflow-x-auto"
                onScroll={(e) => {
                  const el = e.currentTarget;
                  setBannerIndex(Math.round(el.scrollLeft / el.clientWidth));
                }}
              >
                {data.banners.map((b) => (
                  <div key={b.id} className="w-full shrink-0 snap-center px-4">
                    <div className="relative h-40 overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700">
                      <SafeImg
                        src={b.mobileImage || b.image}
                        alt={b.title}
                        className="h-full w-full object-cover"
                        iconSize={40}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent p-4">
                        <p className="mt-2 max-w-[70%] text-lg font-extrabold leading-6 text-white">
                          {b.title}
                        </p>
                        {b.subtitle && (
                          <p className="mt-1 max-w-[65%] text-xs text-white/80">{b.subtitle}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {data.banners.length > 1 && (
                <div className="mt-2 flex justify-center gap-1.5">
                  {data.banners.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        i === bannerIndex ? "w-5 bg-green-600" : "w-1.5 bg-gray-300"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Kategoriyalar */}
          {data.categories.length > 0 && (
            <Section title="Kategoriyalar" href="/customer/categories">
              <div className="scrollbar-none flex gap-3 overflow-x-auto px-4">
                {data.categories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/customer/products?categoryId=${c.id}&title=${encodeURIComponent(c.name)}`}
                    className="flex w-[76px] shrink-0 flex-col items-center gap-1.5"
                  >
                    <span
                      className="flex h-[64px] w-[64px] items-center justify-center rounded-2xl text-2xl shadow-sm ring-1 ring-gray-100"
                      style={{ backgroundColor: (c.color ?? "#16a34a") + "1a" }}
                    >
                      {c.image ? (
                        <SafeImg src={c.image} alt={c.name} className="h-full w-full rounded-2xl object-cover" iconSize={24} />
                      ) : (
                        c.icon ?? "🛒"
                      )}
                    </span>
                    <span className="line-clamp-2 text-center text-[11px] font-medium leading-3.5 text-gray-700">
                      {c.name}
                    </span>
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {/* Aksiyalar */}
          {data.promotions.length > 0 && (
            <Section title="Aksiyalar">
              <div className="scrollbar-none flex gap-3 overflow-x-auto px-4">
                {data.promotions.map((p) => (
                  <Link
                    key={p.id}
                    href={`/customer/products?promotionId=${p.id}&title=${encodeURIComponent(p.name)}`}
                    className="relative w-64 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 p-4 text-white shadow-md"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-white/80">
                      <Percent size={14} />
                      {p.discountType === "percentage"
                        ? `${p.discountValue}% chegirma`
                        : "Maxsus chegirma"}
                    </div>
                    <p className="mt-1.5 text-base font-extrabold leading-5">{p.name}</p>
                    <p className="mt-2 text-[11px] text-white/70">
                      {fmtDate(p.endsAt)} gacha amal qiladi
                    </p>
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {/* Mashhur mahsulotlar */}
          {data.popularProducts.length > 0 && (
            <Section title="Mashhur mahsulotlar" href="/customer/products?sort=popular&title=Mashhur mahsulotlar">
              <ProductRow products={data.popularProducts} />
            </Section>
          )}

          {/* Chegirmadagi mahsulotlar */}
          {data.discountedProducts.length > 0 && (
            <Section title="Chegirmadagi mahsulotlar" href="/customer/products?filter=discounted&title=Chegirmalar">
              <ProductRow products={data.discountedProducts} />
            </Section>
          )}

          {/* Yangi mahsulotlar */}
          {data.newProducts.length > 0 && (
            <Section title="Yangi mahsulotlar" href="/customer/products?filter=new&title=Yangi mahsulotlar">
              <ProductRow products={data.newProducts} />
            </Section>
          )}

          {/* Tavsiya etilgan */}
          {data.featuredProducts.length > 0 && (
            <Section title="Tavsiya etamiz" href="/customer/products?filter=featured&title=Tavsiya etilgan">
              <div className="grid grid-cols-2 gap-3 px-4">
                {data.featuredProducts.slice(0, 6).map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </Section>
          )}
        </>
      )}

      <BottomNav />
    </div>
  );
}
