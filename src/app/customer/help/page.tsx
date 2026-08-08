"use client";

import { Phone, Mail, MessageCircle } from "lucide-react";
import BottomNav from "@/components/customer/BottomNav";
import { TopBar } from "@/components/customer/Shared";

const FAQ = [
  {
    q: "Buyurtmam qachon yetkaziladi?",
    a: "Buyurtmalar odatda 90 daqiqa ichida yetkaziladi. Buyurtma holatini \"Buyurtmalarim\" bo'limida kuzatishingiz mumkin.",
  },
  {
    q: "Yetkazib berish narxi qancha?",
    a: "Yetkazib berish narxi 15 000 so'm. 200 000 so'mdan yuqori buyurtmalar uchun yetkazib berish bepul.",
  },
  {
    q: "Buyurtmani bekor qilsam bo'ladimi?",
    a: "Ha, buyurtma hali tasdiqlanmagan yoki endigina tasdiqlangan bo'lsa, uni buyurtma sahifasidan bekor qilishingiz mumkin.",
  },
  {
    q: "To'lovni qanday amalga oshiraman?",
    a: "Hozircha naqd pul yoki bank kartasi orqali yetkazib berilganda to'lashingiz mumkin.",
  },
  {
    q: "Mahsulot sifatsiz chiqsa nima qilaman?",
    a: "Yordam markazimizga qo'ng'iroq qiling — muammoni tezda hal qilamiz yoki pulingizni qaytaramiz.",
  },
];

export default function HelpPage() {
  return (
    <div className="pb-24">
      <TopBar title="Yordam" backHref="/customer/profile" />

      <div className="space-y-4 px-4 pt-3">
        <div className="rounded-2xl bg-gradient-to-br from-green-600 to-emerald-600 p-4 text-white">
          <h2 className="text-base font-extrabold">Yordam kerakmi?</h2>
          <p className="mt-1 text-sm text-green-100">
            Har kuni 08:00 dan 23:00 gacha xizmatdamiz
          </p>
          <div className="mt-3 space-y-2">
            <a
              href="tel:+998712002020"
              className="flex items-center gap-2.5 rounded-xl bg-white/15 px-3.5 py-2.5 text-sm font-semibold"
            >
              <Phone size={16} /> +998 71 200 20 20
            </a>
            <a
              href="mailto:info@barakamarket.uz"
              className="flex items-center gap-2.5 rounded-xl bg-white/15 px-3.5 py-2.5 text-sm font-semibold"
            >
              <Mail size={16} /> info@barakamarket.uz
            </a>
          </div>
        </div>

        <div>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-extrabold text-gray-900">
            <MessageCircle size={16} className="text-green-600" /> Ko&apos;p so&apos;raladigan savollar
          </h2>
          <div className="space-y-2">
            {FAQ.map((f, i) => (
              <details key={i} className="group rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                <summary className="cursor-pointer list-none text-sm font-bold text-gray-800">
                  {f.q}
                </summary>
                <p className="mt-2 text-sm leading-5 text-gray-500">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
