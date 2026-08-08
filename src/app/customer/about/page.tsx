"use client";

import BottomNav from "@/components/customer/BottomNav";
import { TopBar } from "@/components/customer/Shared";

export default function AboutPage() {
  return (
    <div className="pb-24">
      <TopBar title="Biz haqimizda" backHref="/customer/profile" />

      <div className="px-4 pt-4">
        <div className="flex flex-col items-center rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Baraka Market" className="h-20 w-20 rounded-3xl shadow-lg" />
          <h2 className="mt-4 text-xl font-extrabold text-gray-900">BARAKA MARKET</h2>
          <p className="mt-1 text-xs text-gray-400">Versiya 1.0.0</p>
          <p className="mt-4 text-sm leading-6 text-gray-600">
            Baraka Market — oziq-ovqat va uy-ro&apos;zg&apos;or mahsulotlarini onlayn buyurtma
            qilish va tez yetkazib berish xizmati. Minglab sifatli mahsulotlar, qulay narxlar va
            tezkor yetkazib berish — barchasi bitta ilovada.
          </p>
        </div>

        <div className="mt-4 space-y-2.5 rounded-2xl bg-white p-4 text-sm shadow-sm ring-1 ring-gray-100">
          <div className="flex justify-between">
            <span className="text-gray-400">Telefon</span>
            <a href="tel:+998712002020" className="font-semibold text-green-600">
              +998 71 200 20 20
            </a>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Email</span>
            <a href="mailto:info@barakamarket.uz" className="font-semibold text-green-600">
              info@barakamarket.uz
            </a>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Ish vaqti</span>
            <span className="font-semibold text-gray-700">Har kuni 08:00 – 23:00</span>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Baraka Market. Barcha huquqlar himoyalangan.
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
