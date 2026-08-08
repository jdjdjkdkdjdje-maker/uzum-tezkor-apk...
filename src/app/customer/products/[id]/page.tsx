"use client";

import { useCallback, useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  Heart, Star, Minus, Plus, ShoppingCart, Zap, ChevronLeft, BadgeCheck,
} from "lucide-react";
import { toast } from "sonner";
import { api, type ProductCard as ProductCardType } from "@/lib/customer-api";
import { fmtSum, fmtDate } from "@/lib/customer-format";
import { useCustomerStore } from "@/components/customer/Store";
import ProductCard from "@/components/customer/ProductCard";
import { ErrorState, Shimmer, SafeImg } from "@/components/customer/Shared";

type ProductDetail = {
  id: number;
  name: string;
  description: string | null;
  ingredients: string | null;
  price: number;
  oldPrice: number | null;
  discountPercent: number | null;
  weight: number | null;
  weightUnit: string | null;
  volume: number | null;
  volumeUnit: string | null;
  manufacturer: string | null;
  countryOfOrigin: string | null;
  storageConditions: string | null;
  status: string;
  isNew: boolean;
  isOrganic: boolean;
  averageRating: number | null;
  reviewCount: number;
  totalSold: number;
  categoryId: number | null;
  categoryName: string | null;
  brandName: string | null;
  available: number;
  images: string[];
};

type Review = {
  id: number;
  rating: number;
  comment: string | null;
  isVerified: boolean;
  createdAt: string;
  userFirstName: string | null;
  userLastName: string | null;
};

type DetailResponse = {
  product: ProductDetail;
  reviews: Review[];
  similarProducts: ProductCardType[];
  canReview: boolean;
  myReview: { rating: number; comment: string | null } | null;
};

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-gray-300"}
        />
      ))}
    </span>
  );
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { favoriteIds, toggleFavorite, addToCart, user } = useCustomerStore();
  const [data, setData] = useState<DetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await api.get<DetailResponse>(`/api/customer/products/${id}`);
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik yuz berdi");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <div className="min-h-dvh">
        <ErrorState message={error} onRetry={load} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4 p-4">
        <Shimmer className="aspect-square w-full rounded-3xl" />
        <Shimmer className="h-6 w-3/4" />
        <Shimmer className="h-4 w-1/2" />
        <Shimmer className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  const p = data.product;
  const isFavorite = favoriteIds.has(p.id);
  const outOfStock = p.available <= 0 || p.status !== "active";

  const handleAdd = async (): Promise<boolean> => {
    setAdding(true);
    const ok = await addToCart(p.id, qty);
    setAdding(false);
    return ok;
  };

  const handleBuyNow = async () => {
    const ok = await handleAdd();
    if (ok) router.push("/customer/cart");
  };

  const submitReview = async () => {
    setSubmittingReview(true);
    try {
      await api.post("/api/customer/reviews", {
        productId: p.id,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      toast.success("Sharhingiz uchun rahmat!");
      setShowReviewForm(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sharh qoldirishda xatolik");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="pb-32">
      {/* Rasm galereyasi */}
      <div className="relative bg-white">
        <button
          type="button"
          onClick={() => router.back()}
          className="absolute left-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 shadow-md"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          type="button"
          aria-label="Sevimlilarga qo'shish"
          onClick={() => toggleFavorite(p.id)}
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 shadow-md"
        >
          <Heart size={20} className={isFavorite ? "fill-red-500 text-red-500" : "text-gray-500"} />
        </button>

        <div className="aspect-square w-full overflow-hidden bg-gray-50">
          <SafeImg
            src={p.images[imageIndex] ?? null}
            alt={p.name}
            className="h-full w-full object-cover"
            iconSize={56}
          />
        </div>

        {p.images.length > 1 && (
          <div className="scrollbar-none flex gap-2 overflow-x-auto p-3">
            {p.images.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setImageIndex(i)}
                className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-2 transition ${
                  i === imageIndex ? "ring-green-500" : "ring-transparent"
                }`}
              >
                <SafeImg src={img} alt="" className="h-full w-full object-cover" iconSize={20} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Ma'lumot */}
      <div className="mt-2 bg-white px-4 py-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {p.brandName && (
            <span className="rounded-lg bg-gray-100 px-2 py-1 font-semibold text-gray-600">
              {p.brandName}
            </span>
          )}
          {p.categoryName && (
            <span className="rounded-lg bg-green-50 px-2 py-1 font-semibold text-green-600">
              {p.categoryName}
            </span>
          )}
          {p.isOrganic && (
            <span className="rounded-lg bg-emerald-50 px-2 py-1 font-semibold text-emerald-600">
              🌿 Organik
            </span>
          )}
        </div>

        <h1 className="mt-2.5 text-xl font-extrabold leading-6 text-gray-900">{p.name}</h1>

        <div className="mt-2 flex items-center gap-2 text-sm">
          <Stars value={p.averageRating ?? 0} />
          <span className="font-bold text-gray-800">{(p.averageRating ?? 0).toFixed(1)}</span>
          <span className="text-gray-400">({p.reviewCount} ta sharh)</span>
          <span className="text-gray-300">•</span>
          <span className="text-gray-400">{p.totalSold} marta sotilgan</span>
        </div>

        <div className="mt-3 flex items-end gap-2.5">
          <span className="text-2xl font-extrabold text-gray-900">{fmtSum(p.price)}</span>
          {p.oldPrice && (
            <span className="pb-0.5 text-sm text-gray-400 line-through">{fmtSum(p.oldPrice)}</span>
          )}
          {(p.discountPercent ?? 0) > 0 && (
            <span className="mb-0.5 rounded-lg bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">
              -{p.discountPercent}%
            </span>
          )}
        </div>

        <p className={`mt-2 text-sm font-semibold ${outOfStock ? "text-red-500" : p.available <= 10 ? "text-amber-600" : "text-green-600"}`}>
          {outOfStock
            ? "Omborda qolmagan"
            : p.available <= 10
            ? `Omborda atigi ${p.available} dona qoldi!`
            : `Omborda mavjud: ${p.available} dona`}
        </p>

        {/* Miqdor tanlash */}
        {!outOfStock && (
          <div className="mt-4 flex items-center gap-4">
            <span className="text-sm font-semibold text-gray-700">Miqdor:</span>
            <div className="flex items-center gap-3 rounded-2xl bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm active:scale-90"
              >
                <Minus size={16} />
              </button>
              <span className="w-8 text-center text-base font-bold">{qty}</span>
              <button
                type="button"
                onClick={() => {
                  if (qty >= p.available) {
                    toast.error(`Omborda faqat ${p.available} dona qolgan`);
                    return;
                  }
                  setQty((q) => q + 1);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm active:scale-90"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tavsif */}
      {(p.description || p.manufacturer || p.countryOfOrigin || p.weight || p.volume) && (
        <div className="mt-2 bg-white px-4 py-4">
          <h2 className="text-base font-extrabold text-gray-900">Mahsulot haqida</h2>
          {p.description && (
            <p className="mt-2 text-sm leading-6 text-gray-600">{p.description}</p>
          )}
          <dl className="mt-3 space-y-2 text-sm">
            {p.weight != null && (
              <div className="flex justify-between">
                <dt className="text-gray-400">Og&apos;irligi</dt>
                <dd className="font-semibold text-gray-700">{p.weight} {p.weightUnit ?? "g"}</dd>
              </div>
            )}
            {p.volume != null && (
              <div className="flex justify-between">
                <dt className="text-gray-400">Hajmi</dt>
                <dd className="font-semibold text-gray-700">{p.volume} {p.volumeUnit ?? "l"}</dd>
              </div>
            )}
            {p.manufacturer && (
              <div className="flex justify-between">
                <dt className="text-gray-400">Ishlab chiqaruvchi</dt>
                <dd className="font-semibold text-gray-700">{p.manufacturer}</dd>
              </div>
            )}
            {p.countryOfOrigin && (
              <div className="flex justify-between">
                <dt className="text-gray-400">Davlat</dt>
                <dd className="font-semibold text-gray-700">{p.countryOfOrigin}</dd>
              </div>
            )}
            {p.ingredients && (
              <div>
                <dt className="text-gray-400">Tarkibi</dt>
                <dd className="mt-1 text-gray-600">{p.ingredients}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Sharhlar */}
      <div className="mt-2 bg-white px-4 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-gray-900">
            Sharhlar ({data.reviews.length})
          </h2>
          {user && data.canReview && (
            <button
              type="button"
              onClick={() => setShowReviewForm((v) => !v)}
              className="text-sm font-bold text-green-600"
            >
              Sharh yozish
            </button>
          )}
        </div>

        {data.myReview && !data.myReview.comment && null}

        {showReviewForm && (
          <div className="mt-3 rounded-2xl bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-700">Bahoyingiz:</p>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} type="button" onClick={() => setReviewRating(i)}>
                  <Star
                    size={28}
                    className={i <= reviewRating ? "fill-amber-400 text-amber-400" : "text-gray-300"}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Mahsulot haqida fikringiz..."
              rows={3}
              className="mt-3 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-green-500"
            />
            <button
              type="button"
              disabled={submittingReview}
              onClick={submitReview}
              className="mt-2 w-full rounded-xl bg-green-600 py-3 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-60"
            >
              {submittingReview ? "Yuborilmoqda..." : "Sharhni yuborish"}
            </button>
          </div>
        )}

        {data.reviews.length === 0 ? (
          <p className="mt-3 text-sm text-gray-400">
            Hozircha sharhlar yo&apos;q. Birinchi bo&apos;lib sharh qoldiring!
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {data.reviews.map((r) => (
              <div key={r.id} className="rounded-2xl bg-gray-50 p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                      {(r.userFirstName ?? "M").charAt(0)}
                    </span>
                    <div>
                      <p className="flex items-center gap-1 text-sm font-bold text-gray-800">
                        {r.userFirstName ?? "Mijoz"} {r.userLastName?.charAt(0) ?? ""}
                        {r.isVerified && <BadgeCheck size={14} className="text-green-500" />}
                      </p>
                      <p className="text-[11px] text-gray-400">{fmtDate(r.createdAt)}</p>
                    </div>
                  </div>
                  <Stars value={r.rating} size={12} />
                </div>
                {r.comment && <p className="mt-2 text-sm leading-5 text-gray-600">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* O'xshash mahsulotlar */}
      {data.similarProducts.length > 0 && (
        <div className="mt-2 bg-white py-4">
          <h2 className="mb-3 px-4 text-base font-extrabold text-gray-900">
            O&apos;xshash mahsulotlar
          </h2>
          <div className="scrollbar-none flex gap-3 overflow-x-auto px-4">
            {data.similarProducts.map((sp) => (
              <div key={sp.id} className="w-40 shrink-0">
                <ProductCard product={sp} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pastki panel */}
      <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-gray-100 bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="flex gap-2.5">
          <button
            type="button"
            disabled={outOfStock || adding}
            onClick={handleAdd}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-green-600 py-3.5 text-sm font-bold text-green-600 active:scale-[0.98] disabled:border-gray-200 disabled:text-gray-400"
          >
            <ShoppingCart size={18} />
            {outOfStock ? "Tugagan" : "Savatga"}
          </button>
          <button
            type="button"
            disabled={outOfStock || adding}
            onClick={handleBuyNow}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-green-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-green-600/30 active:scale-[0.98] disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
          >
            <Zap size={18} />
            Hozir sotib olish
          </button>
        </div>
      </div>
    </div>
  );
}
