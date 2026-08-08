"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search, LayoutGrid, ChevronRight } from "lucide-react";
import { api, type Category } from "@/lib/customer-api";
import BottomNav from "@/components/customer/BottomNav";
import { EmptyState, ErrorState, Shimmer, SafeImg } from "@/components/customer/Shared";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.get<{ categories: Category[] }>("/api/customer/categories");
      setCategories(data.categories.filter((c) => !c.parentId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik yuz berdi");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="pb-24">
      <header className="sticky top-0 z-30 bg-gray-50/95 px-4 pb-3 pt-4 backdrop-blur-md">
        <h1 className="text-xl font-extrabold text-gray-900">Kategoriyalar</h1>
        <Link
          href="/customer/search"
          className="mt-3 flex items-center gap-2.5 rounded-2xl bg-white px-4 py-3 text-sm text-gray-400 shadow-sm ring-1 ring-gray-100"
        >
          <Search size={18} />
          Qidirish...
        </Link>
      </header>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !categories ? (
        <div className="grid grid-cols-2 gap-3 px-4 pt-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Shimmer key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid size={36} />}
          title="Kategoriyalar topilmadi"
          subtitle="Hozircha kategoriyalar mavjud emas"
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4 pt-2">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/customer/products?categoryId=${c.id}&title=${encodeURIComponent(c.name)}`}
              className="relative overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition active:scale-[0.98]"
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                style={{ backgroundColor: (c.color ?? "#16a34a") + "1a" }}
              >
                {c.image ? (
                  <SafeImg src={c.image} alt={c.name} className="h-full w-full rounded-xl object-cover" iconSize={22} />
                ) : (
                  c.icon ?? "🛒"
                )}
              </span>
              <p className="mt-2.5 line-clamp-2 text-sm font-bold text-gray-900">{c.name}</p>
              <p className="mt-0.5 flex items-center gap-0.5 text-xs text-gray-400">
                {c.productCount} ta mahsulot <ChevronRight size={12} />
              </p>
            </Link>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
