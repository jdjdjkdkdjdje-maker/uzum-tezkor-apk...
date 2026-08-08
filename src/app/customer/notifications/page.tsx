"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, Package, Megaphone, Truck, Info, CheckCheck } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/customer-api";
import { fmtDateTime } from "@/lib/customer-format";
import { useCustomerStore } from "@/components/customer/Store";
import BottomNav from "@/components/customer/BottomNav";
import { TopBar, EmptyState, ErrorState, ListSkeleton } from "@/components/customer/Shared";

type Notification = {
  id: number;
  title: string;
  body: string;
  type: string;
  data: { orderId?: number } | null;
  isRead: boolean;
  isGlobal: boolean;
  createdAt: string;
};

const TYPE_ICONS: Record<string, { icon: typeof Bell; cls: string }> = {
  order: { icon: Package, cls: "bg-blue-50 text-blue-600" },
  promo: { icon: Megaphone, cls: "bg-orange-50 text-orange-600" },
  delivery: { icon: Truck, cls: "bg-green-50 text-green-600" },
  system: { icon: Info, cls: "bg-gray-100 text-gray-600" },
};

export default function NotificationsPage() {
  const { user, loading: userLoading, refreshMe } = useCustomerStore();
  const [items, setItems] = useState<Notification[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.get<{ notifications: Notification[] }>("/api/customer/notifications");
      setItems(data.notifications);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik yuz berdi");
    }
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const markAllRead = async () => {
    try {
      await api.patch("/api/customer/notifications", { all: true });
      await load();
      await refreshMe();
    } catch {
      // e'tiborsiz
    }
  };

  const markRead = async (id: number) => {
    try {
      await api.patch("/api/customer/notifications", { id });
      setItems((prev) => prev?.map((n) => (n.id === id ? { ...n, isRead: true } : n)) ?? null);
      refreshMe();
    } catch {
      // e'tiborsiz
    }
  };

  const unread = items?.filter((n) => !n.isRead).length ?? 0;

  return (
    <div className="pb-24">
      <TopBar
        title="Bildirishnomalar"
        backHref="/customer/home"
        right={
          unread > 0 ? (
            <button
              type="button"
              onClick={markAllRead}
              className="flex items-center gap-1 rounded-xl bg-green-50 px-3 py-2 text-xs font-bold text-green-600"
            >
              <CheckCheck size={14} /> Barchasini o&apos;qish
            </button>
          ) : undefined
        }
      />

      {!userLoading && !user ? (
        <EmptyState
          icon={<Bell size={36} />}
          title="Tizimga kiring"
          subtitle="Bildirishnomalarni ko'rish uchun tizimga kiring"
          actionLabel="Kirish"
          actionHref="/customer/login?next=/customer/notifications"
        />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !items ? (
        <ListSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Bell size={36} />}
          title="Bildirishnomalar yo'q"
          subtitle="Buyurtma yangiliklari va aksiyalar shu yerda ko'rinadi"
        />
      ) : (
        <div className="space-y-2.5 px-4 pt-3">
          {items.map((n) => {
            const meta = TYPE_ICONS[n.type] ?? TYPE_ICONS.system;
            const Icon = meta.icon;
            const content = (
              <div
                className={`flex gap-3 rounded-2xl p-3.5 shadow-sm ring-1 ring-gray-100 transition ${
                  n.isRead ? "bg-white" : "bg-green-50/60"
                }`}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.cls}`}>
                  <Icon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-gray-900">{n.title}</p>
                    {!n.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-green-500" />}
                  </div>
                  <p className="mt-0.5 text-xs leading-4.5 text-gray-500">{n.body}</p>
                  <p className="mt-1.5 text-[10px] text-gray-400">{fmtDateTime(n.createdAt)}</p>
                </div>
              </div>
            );
            return n.data?.orderId ? (
              <Link
                key={n.id}
                href={`/customer/orders/${n.data.orderId}`}
                onClick={() => !n.isRead && markRead(n.id)}
                className="block"
              >
                {content}
              </Link>
            ) : (
              <button
                key={n.id}
                type="button"
                onClick={() => !n.isRead && markRead(n.id)}
                className="block w-full text-left"
              >
                {content}
              </button>
            );
          })}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
