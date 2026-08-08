"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Zap, Truck } from "lucide-react";

const SLIDES = [
  {
    icon: ShoppingBag,
    title: "Baraka Market",
    text: "Minglab sifatli mahsulotlar — oziq-ovqat, ichimliklar, uy-ro'zg'or buyumlari va yana ko'p narsalar bir joyda.",
    color: "from-green-500 to-emerald-600",
  },
  {
    icon: Zap,
    title: "Oson xarid",
    text: "Qidiring, tanlang va bir necha bosishda buyurtma bering. Chegirmalar va kuponlar bilan tejang.",
    color: "from-amber-500 to-orange-600",
  },
  {
    icon: Truck,
    title: "Qulay yetkazib berish",
    text: "Buyurtmangizni eshigingizgacha tez va ehtiyotkorlik bilan yetkazib beramiz. Holatini jonli kuzatib boring.",
    color: "from-sky-500 to-blue-600",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const isLast = step === SLIDES.length - 1;
  const slide = SLIDES[step];
  const Icon = slide.icon;

  const finish = () => {
    localStorage.setItem("bm_onboarded", "1");
    router.replace("/customer/login");
  };

  return (
    <div className="flex min-h-dvh flex-col bg-white px-6 pb-10 pt-6">
      <div className="flex justify-end">
        {!isLast && (
          <button
            type="button"
            onClick={finish}
            className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-400"
          >
            O&apos;tkazib yuborish
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center"
          >
            <div
              className={`mb-8 flex h-40 w-40 items-center justify-center rounded-[2.5rem] bg-gradient-to-br ${slide.color} shadow-xl`}
            >
              <Icon size={72} className="text-white" strokeWidth={1.6} />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900">{slide.title}</h2>
            <p className="mt-3 max-w-[300px] text-[15px] leading-6 text-gray-500">{slide.text}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mb-8 flex justify-center gap-2">
        {SLIDES.map((_, i) => (
          <span
            key={i}
            className={`h-2 rounded-full transition-all ${
              i === step ? "w-6 bg-green-600" : "w-2 bg-gray-200"
            }`}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
        className="w-full rounded-2xl bg-green-600 py-4 text-base font-bold text-white shadow-lg shadow-green-600/30 active:scale-[0.98]"
      >
        {isLast ? "Boshlash" : "Davom etish"}
      </button>
    </div>
  );
}
