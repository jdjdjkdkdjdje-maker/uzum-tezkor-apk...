"use client";

import { useCallback, useEffect, useState, use } from "react";
import Link from "next/link";
import { Check, MapPin, Star, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/customer-api";
import {
  fmtSum, fmtDateTime, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, ORDER_STATUS_FLOW,
  PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS,
} from "@/lib/customer-format";
import { TopBar, ErrorState, ListSkeleton, SafeImg } from "@/components/customer/Shared";

type OrderDetail = {
  id: number;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  deliveryFee: number;
  couponDiscount: number;
  totalAmount: number;
  deliveryAddress: string | null;
  estimatedDeliveryAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  notes: string | null;
  createdAt: string;
  items: Array<{
    id: number;
    productId: number;
    productName: string;
    productImage: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  statusHistory: Array<{ status: string; comment: string | null; createdAt: string }>;
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [reviewFor, setReviewFor] = useState<{ productId: number; name: string } | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setError(null);
      try {
        const res = await api.get<{ order: OrderDetail }>(`/api/customer/orders/${id}`);
        setOrder(res.order);
      } catch (e) {
        if (!silent) setError(e instanceof Error ? e.message : "Xatolik yuz berdi");
      }
    },
    [id]
  );

  useEffect(() => {
    load();
  }, [load]);

  // Faol buyurtma statusini avtomatik yangilab turish
  useEffect(() => {
    if (!order || ["delivered", "cancelled", "returned"].includes(order.status)) return;
    const t = setInterval(() => load(true), 15000);
    return () => clearInterval(t);
  }, [order, load]);

  const cancelOrder = async () => {
    if (!confirm("Buyurtmani bekor qilmoqchimisiz?")) return;
    setCancelling(true);
    try {
      await api.patch(`/api/customer/orders/${id}`, { action: "cancel" });
      toast.success("Buyurtma bekor qilindi");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Xatolik yuz berdi");
    } finally {
      setCancelling(false);
    }
  };

  const submitReview = async () => {
    if (!reviewFor) return;
    setSubmittingReview(true);
    try {
      await api.post("/api/customer/reviews", {
        productId: reviewFor.productId,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      toast.success("Sharhingiz uchun rahmat!");
      setReviewFor(null);
      setReviewComment("");
      setReviewRating(5);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sharh qoldirishda xatolik");
    } finally {
      setSubmittingReview(false);
    }
  };

  const flowIndex = order ? ORDER_STATUS_FLOW.indexOf(order.status) : -1;
  const isCancelled = order?.status === "cancelled" || order?.status === "returned";

  return (
    <div className="pb-10">
      <TopBar title={order ? `№${order.orderNumber}` : "Buyurtma"} backHref="/customer/orders" />

      {error ? (
        <ErrorState message={error} onRetry={() => load()} />
      ) : !order ? (
        <ListSkeleton />
      ) : (
        <div className="space-y-4 px-4 pt-3">
          {/* Status */}
          <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center justify-between">
              <span
                className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                  ORDER_STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"
                }`}
              >
                {ORDER_STATUS_LABELS[order.status] ?? order.status}
              </span>
              <span className="text-xs text-gray-400">{fmtDateTime(order.createdAt)}</span>
            </div>

            {/* Bosqichlar */}
            {!isCancelled && (
              <div className="mt-4 flex items-center">
                {ORDER_STATUS_FLOW.map((s, i) => (
                  <div key={s} className="flex flex-1 items-center last:flex-none">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                        i <= flowIndex ? "bg-green-600 text-white" : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      {i < flowIndex ? <Check size={12} /> : i + 1}
                    </span>
                    {i < ORDER_STATUS_FLOW.length - 1 && (
                      <span
                        className={`h-0.5 flex-1 ${i < flowIndex ? "bg-green-600" : "bg-gray-200"}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {isCancelled && order.cancelReason && (
              <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
                Sabab: {order.cancelReason}
              </p>
            )}

            {/* Status tarixi */}
            {order.statusHistory.length > 0 && (
              <div className="mt-4 space-y-2.5 border-t border-dashed border-gray-100 pt-3">
                {order.statusHistory.map((h, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-green-500" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-800">
                        {ORDER_STATUS_LABELS[h.status] ?? h.status}
                      </p>
                      {h.comment && <p className="text-[11px] text-gray-500">{h.comment}</p>}
                    </div>
                    <span className="shrink-0 text-[10px] text-gray-400">
                      {fmtDateTime(h.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Mahsulotlar */}
          <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-sm font-extrabold text-gray-900">Mahsulotlar</h2>
            <div className="mt-3 space-y-3">
              {order.items.map((it) => (
                <div key={it.id} className="flex items-center gap-3">
                  <Link
                    href={`/customer/products/${it.productId}`}
                    className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-50 ring-1 ring-gray-100"
                  >
                    <SafeImg src={it.productImage} alt={it.productName} className="h-full w-full object-cover" iconSize={20} />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold text-gray-800">
                      {it.productName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {it.quantity} × {fmtSum(it.unitPrice)}
                    </p>
                    {order.status === "delivered" && (
                      <button
                        type="button"
                        onClick={() => setReviewFor({ productId: it.productId, name: it.productName })}
                        className="mt-0.5 flex items-center gap-1 text-xs font-bold text-amber-500"
                      >
                        <Star size={12} className="fill-amber-400 text-amber-400" /> Sharh qoldirish
                      </button>
                    )}
                  </div>
                  <span className="text-sm font-bold text-gray-900">{fmtSum(it.totalPrice)}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Manzil va to'lov */}
          <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-start gap-2.5">
              <MapPin size={16} className="mt-0.5 shrink-0 text-green-600" />
              <div>
                <p className="text-xs text-gray-400">Yetkazib berish manzili</p>
                <p className="text-sm font-semibold leading-5 text-gray-800">
                  {order.deliveryAddress ?? "—"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-dashed border-gray-100 pt-3 text-sm">
              <div>
                <p className="text-xs text-gray-400">To&apos;lov usuli</p>
                <p className="font-semibold text-gray-800">
                  {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">To&apos;lov holati</p>
                <p className="font-semibold text-gray-800">
                  {PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
                </p>
              </div>
            </div>
          </section>

          {/* Hisob */}
          <section className="space-y-2 rounded-2xl bg-white p-4 text-sm shadow-sm ring-1 ring-gray-100">
            <div className="flex justify-between text-gray-500">
              <span>Mahsulotlar</span>
              <span className="font-semibold text-gray-800">{fmtSum(order.subtotal)}</span>
            </div>
            {order.couponDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Kupon chegirmasi</span>
                <span className="font-semibold">-{fmtSum(order.couponDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-500">
              <span>Yetkazib berish</span>
              <span className="font-semibold text-gray-800">
                {order.deliveryFee === 0 ? "Bepul" : fmtSum(order.deliveryFee)}
              </span>
            </div>
            <div className="flex justify-between border-t border-dashed border-gray-200 pt-2.5 text-base">
              <span className="font-bold text-gray-900">Jami</span>
              <span className="font-extrabold text-green-600">{fmtSum(order.totalAmount)}</span>
            </div>
          </section>

          {(order.status === "pending" || order.status === "confirmed") && (
            <button
              type="button"
              disabled={cancelling}
              onClick={cancelOrder}
              className="w-full rounded-2xl border-2 border-red-200 py-3.5 text-sm font-bold text-red-500 active:scale-[0.98] disabled:opacity-60"
            >
              {cancelling ? "Bekor qilinmoqda..." : "Buyurtmani bekor qilish"}
            </button>
          )}
        </div>
      )}

      {/* Sharh modali */}
      {reviewFor && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="w-full max-w-md rounded-t-3xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-gray-900">Sharh qoldirish</h3>
              <button type="button" onClick={() => setReviewFor(null)} className="text-gray-400">
                <X size={20} />
              </button>
            </div>
            <p className="mt-1 line-clamp-1 text-sm text-gray-500">{reviewFor.name}</p>
            <div className="mt-4 flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} type="button" onClick={() => setReviewRating(i)}>
                  <Star
                    size={34}
                    className={i <= reviewRating ? "fill-amber-400 text-amber-400" : "text-gray-300"}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Mahsulot haqida fikringiz (ixtiyoriy)..."
              rows={3}
              className="mt-4 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-green-500"
            />
            <button
              type="button"
              disabled={submittingReview}
              onClick={submitReview}
              className="mt-3 w-full rounded-2xl bg-green-600 py-3.5 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-60"
            >
              {submittingReview ? "Yuborilmoqda..." : "Sharhni yuborish"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
