"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PackageSearch, ArrowUpDown } from "lucide-react";
import { api, type ProductCard as ProductCardType } from "@/lib/customer-api";
import BottomNav from "@/components/customer/BottomNav";
import ProductCard from "@/components/customer/ProductCard";
import { TopBar, EmptyState, ErrorState, ProductGridSkeleton } from "@/components/customer/Shared";

const SORT_OPTIONS = [
  { value: "popular", label: "Mashhur" },
  { value: "newest", label: "Yangi" },
  { value: "price_asc", label: "Arzon narx" },
  { value: "price_desc", label: "Qimmat narx" },
  { value: "rating", label: "Reyting" },
  { value: "discount", label: "Chegirma" },
];

function ProductsList() {
  const searchParams = useSearchParams();
  const title = searchParams.get("title") || "Mahsulotlar";
  const [products, setProducts] = useState<ProductCardType[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState(searchParams.get("sort") || "popular");
  const [showSort, setShowSort] = useState(false);

  const buildQuery = useCallback(
    (p: number, s: string) => {
      const q = new URLSearchParams();
      for (const key of ["categoryId", "brandId", "promotionId", "filter", "search"]) {
        const v = searchParams.get(key);
        if (v) q.set(key, v);
      }
      q.set("sort", s);
      q.set("page", String(p));
      q.set("limit", "20");
      return q.toString();
    },
    [searchParams]
  );

  const load = useCallback(
    async (p: number, s: string, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);
      try {
        const data = await api.get<{
          products: ProductCardType[];
          total: number;
          totalPages: number;
        }>(`/api/customer/products?${buildQuery(p, s)}`);
        setProducts((prev) => (append ? [...prev, ...data.products] : data.products));
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setPage(p);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Xatolik yuz berdi");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [buildQuery]
  );

  useEffect(() => {
    load(1, sort, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, sort]);

  return (
    <div className="pb-24">
      <TopBar
        title={title}
        right={
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSort((v) => !v)}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-gray-50 px-3 text-xs font-semibold text-gray-700"
            >
              <ArrowUpDown size={14} />
              {SORT_OPTIONS.find((o) => o.value === sort)?.label}
            </button>
            {showSort && (
              <div className="absolute right-0 top-11 z-40 w-40 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-100">
                {SORT_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => {
                      setSort(o.value);
                      setShowSort(false);
                    }}
                    className={`block w-full px-4 py-2.5 text-left text-sm ${
                      sort === o.value ? "bg-green-50 font-bold text-green-600" : "text-gray-700"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        }
      />

      <div className="px-4 pt-3">
        {loading ? (
          <ProductGridSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={() => load(1, sort, false)} />
        ) : products.length === 0 ? (
          <EmptyState
            icon={<PackageSearch size={36} />}
            title="Mahsulotlar topilmadi"
            subtitle="Bu bo'limda hozircha mahsulotlar yo'q"
            actionLabel="Bosh sahifaga qaytish"
            actionHref="/customer/home"
          />
        ) : (
          <>
            <p className="mb-3 text-xs text-gray-500">{total} ta mahsulot topildi</p>
            <div className="grid grid-cols-2 gap-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            {page < totalPages && (
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => load(page + 1, sort, true)}
                className="mt-5 w-full rounded-2xl bg-white py-3.5 text-sm font-bold text-green-600 shadow-sm ring-1 ring-gray-100 active:scale-[0.98] disabled:opacity-60"
              >
                {loadingMore ? "Yuklanmoqda..." : "Yana ko'rsatish"}
              </button>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="px-4 pt-6"><ProductGridSkeleton /></div>}>
      <ProductsList />
    </Suspense>
  );
}
