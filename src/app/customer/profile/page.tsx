"use client";

import Link from "next/link";
import {
  User, Package, Heart, MapPin, Bell, Settings, HelpCircle, Info, LogOut, ChevronRight,
} from "lucide-react";
import { useCustomerStore } from "@/components/customer/Store";
import BottomNav from "@/components/customer/BottomNav";
import { EmptyState, Shimmer } from "@/components/customer/Shared";

const MENU = [
  { href: "/customer/profile/edit", label: "Shaxsiy ma'lumotlar", icon: User },
  { href: "/customer/orders", label: "Buyurtmalarim", icon: Package },
  { href: "/customer/favorites", label: "Sevimlilar", icon: Heart },
  { href: "/customer/addresses", label: "Manzillarim", icon: MapPin },
  { href: "/customer/notifications", label: "Bildirishnomalar", icon: Bell },
  { href: "/customer/settings", label: "Sozlamalar", icon: Settings },
  { href: "/customer/help", label: "Yordam", icon: HelpCircle },
  { href: "/customer/about", label: "Biz haqimizda", icon: Info },
];

export default function ProfilePage() {
  const { user, loading, logout, unreadNotifications } = useCustomerStore();

  return (
    <div className="pb-24">
      <header className="bg-gradient-to-b from-green-600 to-emerald-600 px-4 pb-8 pt-6 text-white">
        <h1 className="text-xl font-extrabold">Profil</h1>
        {loading ? (
          <div className="mt-4 flex items-center gap-3">
            <Shimmer className="h-16 w-16 rounded-2xl bg-white/30" />
            <div className="space-y-2">
              <Shimmer className="h-4 w-32 bg-white/30" />
              <Shimmer className="h-3 w-24 bg-white/30" />
            </div>
          </div>
        ) : user ? (
          <div className="mt-4 flex items-center gap-3.5">
            <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white/20 text-2xl font-extrabold">
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                (user.firstName ?? "M").charAt(0)
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-extrabold">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sm text-green-100">{user.phone}</p>
              {user.email && <p className="truncate text-xs text-green-200">{user.email}</p>}
            </div>
          </div>
        ) : null}
      </header>

      {!loading && !user ? (
        <EmptyState
          icon={<User size={36} />}
          title="Tizimga kirmagansiz"
          subtitle="Profilingizni ko'rish uchun tizimga kiring yoki ro'yxatdan o'ting"
          actionLabel="Kirish"
          actionHref="/customer/login?next=/customer/profile"
        />
      ) : (
        <div className="-mt-4 px-4">
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
            {MENU.map((item, i) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3.5 px-4 py-3.5 transition active:bg-gray-50 ${
                    i > 0 ? "border-t border-gray-50" : ""
                  }`}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-green-600">
                    <Icon size={18} />
                  </span>
                  <span className="flex-1 text-sm font-semibold text-gray-800">{item.label}</span>
                  {item.href === "/customer/notifications" && unreadNotifications > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                      {unreadNotifications}
                    </span>
                  )}
                  <ChevronRight size={16} className="text-gray-300" />
                </Link>
              );
            })}
          </div>

          {user && (
            <button
              type="button"
              onClick={logout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-sm font-bold text-red-500 shadow-sm ring-1 ring-gray-100 active:scale-[0.98]"
            >
              <LogOut size={16} /> Chiqish
            </button>
          )}

          <p className="mt-6 text-center text-xs text-gray-400">Baraka Market • v1.0.0</p>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
