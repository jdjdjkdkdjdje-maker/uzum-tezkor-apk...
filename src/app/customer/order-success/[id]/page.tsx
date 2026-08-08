"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, MapPin, Calendar, Receipt } from "lucide-react";
import { api, type OrderSummary } from "@/lib/customer-api";
import { fmtSum, fmtDateTime } from "@/lib/customer-format";
import { Shimmer } from "@/components/customer/Shared";

export default function OrderSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<OrderSummary | null>(null);

  useEffect(() => {
    api
      .get<{ order: OrderSummary }>(`/api/customer/orders/${id}`)
      .then((res) => setOrder(res.order))
      .catch(() => {});
  }, [id]);

  return (
    <div className="flex min-h-dvh flex-col items-center bg-white px-6 pb-8 pt-20">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 12 }}
        className="flex h-24 w-24 items-center justify-center rounded-full bg-green-100"
      >
        <CheckCircle2 size={56} className="text-green-600" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 text-center text-2xl font-extrabold text-gray-900"
      >
        Buyurtmangiz qabul qilindi!
      </motion.h1>
      <p className="mt-2 text-center text-sm text-gray-500">
        Tez orada operatorlarimiz siz bilan bog&apos;lanadi
      </p>

      <div className="mt-8 w-full space-y-3 rounded-2xl bg-gray-50 p-4">
        {!order ? (
          <>
            <Shimmer className="h-5 w-2/3" />
            <Shimmer className="h-5 w-1/2" />
            <Shimmer className="h-5 w-3/4" />
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <Receipt size={18} className="shrink-0 text-green-600" />
              <div>
                <p className="text-xs text-gray-400">Buyurtma raqami</p>
                <p className="text-sm font-bold text-gray-900">№{order.orderNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar size={18} className="shrink-0 text-green-600" />
              <div>
                <p className="text-xs text-gray-400">Sana</p>
                <p className="text-sm font-bold text-gray-900">{fmtDateTime(order.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin size={18} className="shrink-0 text-green-600" />
              <div>
                <p className="text-xs text-gray-400">Yetkazib berish manzili</p>
                <p className="text-sm font-semibold leading-5 text-gray-900">
                  {order.deliveryAddress}
                </p>
              </div>
            </div>
            <div className="border-t border-dashed border-gray-200 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900">Jami summa</span>
                <span className="text-lg font-extrabold text-green-600">
                  {fmtSum(order.totalAmount)}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-auto w-full space-y-3 pt-8">
        <Link
          href={`/customer/orders/${id}`}
          className="block w-full rounded-2xl bg-green-600 py-4 text-center text-base font-bold text-white shadow-lg shadow-green-600/30 active:scale-[0.98]"
        >
          Buyurtmani ko&apos;rish
        </Link>
        <Link
          href="/customer/home"
          className="block w-full rounded-2xl bg-gray-100 py-4 text-center text-base font-bold text-gray-700 active:scale-[0.98]"
        >
          Xaridni davom ettirish
        </Link>
      </div>
    </div>
  );
}
