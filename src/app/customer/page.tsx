"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useCustomerStore } from "@/components/customer/Store";

// Splash: sessiyani tekshiradi va kerakli sahifaga yo'naltiradi
export default function SplashPage() {
  const router = useRouter();
  const { user, loading } = useCustomerStore();
  const [minDelayDone, setMinDelayDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinDelayDone(true), 1800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (loading || !minDelayDone) return;
    const onboarded = typeof window !== "undefined" && localStorage.getItem("bm_onboarded") === "1";
    if (!onboarded) {
      router.replace("/customer/onboarding");
    } else if (user) {
      router.replace("/customer/home");
    } else {
      router.replace("/customer/login");
    }
  }, [loading, minDelayDone, user, router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-green-600 via-green-600 to-emerald-700 px-8">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="flex h-28 w-28 items-center justify-center rounded-[2rem] bg-white shadow-2xl"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Baraka Market" className="h-20 w-20 rounded-3xl object-contain" />
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mt-6 text-3xl font-extrabold tracking-tight text-white"
      >
        BARAKA MARKET
      </motion.h1>

      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="mt-2 text-sm text-green-100"
      >
        Barakali xaridlar manzili
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-16 flex gap-1.5"
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
            className="h-2 w-2 rounded-full bg-white"
          />
        ))}
      </motion.div>
    </div>
  );
}
