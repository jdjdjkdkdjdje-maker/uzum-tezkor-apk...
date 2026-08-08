"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Clock, Trash2, SearchX, ArrowLeft } from "lucide-react";
import { api, type ProductCard as ProductCardType } from "@/lib/customer-api";
import { useCustomerStore } from "@/components/customer/Store";
import BottomNav from "@/components/customer/BottomNav";
import ProductCard from "@/components/customer/ProductCard";
import { ErrorState, ProductGridSkeleton } from "@/components/customer/Shared";

const LOCAL_KEY = "bm_search_history";

export default function SearchPage() {
  const router = useRouter();
  const { user } = useCustomerStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductCardType[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Tarixni yuklash: serverdan (agar kirgan bo'lsa), aks holda localdan
  useEffect(() => {
    (async () => {
      if (user) {
        try {
          const data = await api.get<{ history: string[] }>("/api/customer/search-history");
          setHistory(data.history);
          return;
        } catch {
          // lokalga o'tamiz
        }
      }
      try {
        setHistory(JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]"));
      } catch {
        setHistory([]);
      }
    })();
  }, [user]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const saveLocalHistory = (q: string) => {
    try {
      const prev: string[] = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]");
      const next = [q, ...prev.filter((x) => x !== q)].slice(0, 10);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
      setHistory(next);
    } catch {
      // e'tiborsiz
    }
  };

  const doSearch = useCallback(async (q: string, p: number, append: boolean) => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await api.get<{
        products: ProductCardType[];
        total: number;
        totalPages: number;
      }>(`/api/customer/products?search=${encodeURIComponent(q.trim())}&page=${p}&limit=20`);
      setResults((prev) => (append && prev ? [...prev, ...data.products] : data.products));
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setPage(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik yuz berdi");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const onQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setResults(null);
      return;
    }
    debounceRef.current = setTimeout(() => {
      doSearch(value, 1, false);
      saveLocalHistory(value.trim());
    }, 450);
  };

  const clearHistory = async () => {
    localStorage.removeItem(LOCAL_KEY);
    setHistory([]);
    if (user) {
      try {
        await api.delete("/api/customer/search-history");
      } catch {
        // e'tiborsiz
      }
    }
  };

  return (
    <div className="pb-24">
      <header className="sticky top-0 z-30 flex items-center gap-2 bg-gray-50/95 px-3 py-3 backdrop-blur-md">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-gray-700 shadow-sm ring-1 ring-gray-100"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Mahsulot, brend, kategoriya..."
            className="w-full rounded-2xl bg-white py-3 pl-10 pr-10 text-sm shadow-sm ring-1 ring-gray-100 outline-none focus:ring-green-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults(null);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </header>

      <div className="px-4 pt-2">
        {results === null && !loading ? (
          history.length > 0 ? (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900">Qidiruv tarixi</h2>
                <button
                  type="button"
                  onClick={clearHistory}
                  className="flex items-center gap-1 text-xs font-semibold text-red-500"
                >
                  <Trash2 size={13} /> Tozalash
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {history.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => {
                      setQuery(h);
                      doSearch(h, 1, false);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-sm text-gray-700 shadow-sm ring-1 ring-gray-100"
                  >
                    <Clock size={13} className="text-gray-400" />
                    {h}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-16 text-center">
              <Search size={40} className="text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">
                Mahsulot nomi, brend yoki kategoriya bo&apos;yicha qidiring
              </p>
            </div>
          )
        ) : loading ? (
          <ProductGridSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={() => doSearch(query, 1, false)} />
        ) : results && results.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-100 text-gray-400">
              <SearchX size={36} />
            </div>
            <h3 className="mt-4 text-base font-bold text-gray-900">Hech narsa topilmadi</h3>
            <p className="mt-1 max-w-[260px] text-sm text-gray-500">
              &quot;{query}&quot; bo&apos;yicha natija yo&apos;q. Boshqa so&apos;z bilan urinib
              ko&apos;ring.
            </p>
          </div>
        ) : results ? (
          <>
            <p className="mb-3 text-xs text-gray-500">{total} ta natija topildi</p>
            <div className="grid grid-cols-2 gap-3">
              {results.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            {page < totalPages && (
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => doSearch(query, page + 1, true)}
                className="mt-5 w-full rounded-2xl bg-white py-3.5 text-sm font-bold text-green-600 shadow-sm ring-1 ring-gray-100 active:scale-[0.98] disabled:opacity-60"
              >
                {loadingMore ? "Yuklanmoqda..." : "Yana ko'rsatish"}
              </button>
            )}
          </>
        ) : null}
      </div>

      <BottomNav />
    </div>
  );
}
