"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Package, RefreshCw, ChevronRight } from "lucide-react";
import { api, type OrderSummary } from "@/lib/customer-api";
import {
  fmtSum, fmtDateTime, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, PAYMENT_STATUS_LABELS,
} from "@/lib/customer-format";
import { useCustomerStore } from "@/components/customer/Store";
import BottomNav from "@/components/customer/BottomNav";
import { EmptyState, ErrorState, ListSkeleton, SafeImg } from "@/components/customer/Shared";

export default function OrdersPage() {
  const { user, loading: userLoading } = useCustomerStore();
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (p: number, append: boolean, silent = false) => {
    if (!silent && !append) setError(null);
    if (append) setLoadingMore(true);
    try {
      const data = await api.get<{ orders: OrderSummary[]; totalPages: number }>(
        `/api/customer/orders?page=${p}&limit=10`
      );
      setOrders((prev) => (append && prev ? [...prev, ...data.orders] : data.orders));
      setTotalPages(data.totalPages);
      setPage(p);
    } catch (e) {
      if (!silent) setError(e instanceof Error ? e.message : "Xatolik yuz berdi");
    } finally {
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user) load(1, false);
  }, [user, load]);

  // Har 20 soniyada statuslarni avtomatik yangilash
  useEffect(() => {
    if (!user) return;
    const t = setInterval(() => load(1, false, true), 20000);
    return () => clearInterval(t);
  }, [user, load]);

  return (
    <div className="pb-24">
      <header className="sticky top-0 z-30 flex items-center justify-between bg-gray-50/95 px-4 py-4 backdrop-blur-md">
        <h1 className="text-xl font-extrabold text-gray-900">Buyurtmalarim</h1>
        {user && (
          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              load(1, false);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-gray-100"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin text-green-600" : "text-gray-600"} />
          </button>
        )}
      </header>

      {!userLoading && !user ? (
        <EmptyState
          icon={<Package size={36} />}
          title="Tizimga kiring"
          subtitle="Buyurtmalaringizni ko'rish uchun tizimga kiring"
          actionLabel="Kirish"
          actionHref="/customer/login?next=/customer/orders"
        />
      ) : error && !orders ? (
        <ErrorState message={error} onRetry={() => load(1, false)} />
      ) : !orders ? (
        <ListSkeleton />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<Package size={36} />}
          title="Buyurtmalar yo'q"
          subtitle="Siz hali buyurtma bermagansiz. Birinchi buyurtmangizni bering!"
          actionLabel="Xarid qilish"
          actionHref="/customer/home"
        />
      ) : (
        <div className="space-y-3 px-4">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/customer/orders/${o.id}`}
              className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-gray-900">№{o.orderNumber}</span>
                <span
                  className={`rounded-lg px-2 py-1 text-[11px] font-bold ${
                    ORDER_STATUS_COLORS[o.status] ?? "bg-gray-100 text-gray-600"
                  }`}
                >
                  {ORDER_STATUS_LABELS[o.status] ?? o.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-400">{fmtDateTime(o.createdAt)}</p>

              {/* Mahsulot rasmlari */}
              <div className="mt-3 flex items-center gap-2">
                {o.items.slice(0, 4).map((it) => (
                  <span key={it.id} className="h-12 w-12 overflow-hidden rounded-xl bg-gray-50 ring-1 ring-gray-100">
                    <SafeImg src={it.productImage} alt={it.productName} className="h-full w-full object-cover" iconSize={18} />
                  </span>
                ))}
                {o.items.length > 4 && (
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-xs font-bold text-gray-500">
                    +{o.items.length - 4}
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-dashed border-gray-100 pt-3">
                <div>
                  <p className="text-xs text-gray-400">
                    {o.items.reduce((s, i) => s + i.quantity, 0)} dona mahsulot •{" "}
                    {PAYMENT_STATUS_LABELS[o.paymentStatus] ?? o.paymentStatus}
                  </p>
                  <p className="text-base font-extrabold text-gray-900">{fmtSum(o.totalAmount)}</p>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
              </div>
            </Link>
          ))}

          {page < totalPages && (
            <button
              type="button"
              disabled={loadingMore}
              onClick={() => load(page + 1, true)}
              className="w-full rounded-2xl bg-white py-3.5 text-sm font-bold text-green-600 shadow-sm ring-1 ring-gray-100 active:scale-[0.98] disabled:opacity-60"
            >
              {loadingMore ? "Yuklanmoqda..." : "Yana ko'rsatish"}
            </button>
          )}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
