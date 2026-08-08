"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ShoppingCart, Package, User } from "lucide-react";
import { useCustomerStore } from "./Store";

const TABS = [
  { href: "/customer/home", label: "Bosh sahifa", icon: Home },
  { href: "/customer/categories", label: "Katalog", icon: LayoutGrid },
  { href: "/customer/cart", label: "Savatcha", icon: ShoppingCart },
  { href: "/customer/orders", label: "Buyurtmalar", icon: Package },
  { href: "/customer/profile", label: "Profil", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { cartCount } = useCustomerStore();

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-gray-100 bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5">
        {TABS.map((tab) => {
          const active =
            pathname === tab.href || (tab.href !== "/customer/home" && pathname.startsWith(tab.href));
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                active ? "text-green-600" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <span className="relative">
                <Icon size={22} strokeWidth={active ? 2.4 : 2} />
                {tab.href === "/customer/cart" && cartCount > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </span>
              <span className="max-w-full truncate px-0.5">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
