"use client";

import { useCallback, useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { api, type ProductCard as ProductCardType } from "@/lib/customer-api";
import { useCustomerStore } from "@/components/customer/Store";
import BottomNav from "@/components/customer/BottomNav";
import ProductCard from "@/components/customer/ProductCard";
import { TopBar, EmptyState, ErrorState, ProductGridSkeleton } from "@/components/customer/Shared";

export default function FavoritesPage() {
  const { user, loading: userLoading, favoriteIds } = useCustomerStore();
  const [products, setProducts] = useState<ProductCardType[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.get<{ products: ProductCardType[] }>("/api/customer/wishlist");
      setProducts(data.products);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik yuz berdi");
    }
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const visible = products?.filter((p) => favoriteIds.has(p.id)) ?? null;

  return (
    <div className="pb-24">
      <TopBar title="Sevimlilar" backHref="/customer/profile" />

      <div className="px-4 pt-3">
        {!userLoading && !user ? (
          <EmptyState
            icon={<Heart size={36} />}
            title="Tizimga kiring"
            subtitle="Sevimli mahsulotlaringizni ko'rish uchun tizimga kiring"
            actionLabel="Kirish"
            actionHref="/customer/login?next=/customer/favorites"
          />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : visible === null ? (
          <ProductGridSkeleton />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<Heart size={36} />}
            title="Sevimlilar bo'sh"
            subtitle="Yoqqan mahsulotlaringizni yurakcha belgisi bilan saqlab qo'ying"
            actionLabel="Xarid qilish"
            actionHref="/customer/home"
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
