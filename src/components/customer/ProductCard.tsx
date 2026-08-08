"use client";

import Link from "next/link";
import { Heart, Plus, Star } from "lucide-react";
import { fmtSum } from "@/lib/customer-format";
import type { ProductCard as ProductCardType } from "@/lib/customer-api";
import { useCustomerStore } from "./Store";
import { SafeImg } from "./Shared";

export default function ProductCard({ product }: { product: ProductCardType }) {
  const { favoriteIds, toggleFavorite, addToCart } = useCustomerStore();
  const isFavorite = favoriteIds.has(product.id);
  const outOfStock = product.available <= 0 || product.status !== "active";

  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
      <Link href={`/customer/products/${product.id}`} className="relative block aspect-square bg-gray-50">
        <SafeImg
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover"
          iconSize={36}
        />
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {(product.discountPercent ?? 0) > 0 && (
            <span className="rounded-lg bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              -{product.discountPercent}%
            </span>
          )}
          {product.isNew && (
            <span className="rounded-lg bg-blue-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              Yangi
            </span>
          )}
        </div>
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <span className="rounded-xl bg-gray-800/90 px-2.5 py-1 text-[11px] font-semibold text-white">
              Tugagan
            </span>
          </div>
        )}
      </Link>

      <button
        type="button"
        aria-label="Sevimlilarga qo'shish"
        onClick={() => toggleFavorite(product.id)}
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition active:scale-90"
      >
        <Heart
          size={16}
          className={isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"}
        />
      </button>

      <div className="flex flex-1 flex-col gap-1 p-2.5">
        {product.brandName && (
          <span className="truncate text-[10px] font-medium uppercase tracking-wide text-gray-400">
            {product.brandName}
          </span>
        )}
        <Link
          href={`/customer/products/${product.id}`}
          className="line-clamp-2 min-h-[2rem] text-[13px] font-medium leading-4 text-gray-800"
        >
          {product.name}
        </Link>
        <div className="flex items-center gap-1 text-[11px] text-gray-500">
          <Star size={12} className="fill-amber-400 text-amber-400" />
          <span className="font-semibold text-gray-700">
            {(product.averageRating ?? 0).toFixed(1)}
          </span>
          <span>({product.reviewCount})</span>
        </div>
        <div className="mt-auto flex items-end justify-between gap-1 pt-1">
          <div className="min-w-0">
            {product.oldPrice && (
              <div className="text-[10px] text-gray-400 line-through">
                {fmtSum(product.oldPrice)}
              </div>
            )}
            <div className="truncate text-sm font-bold text-gray-900">{fmtSum(product.price)}</div>
          </div>
          <button
            type="button"
            aria-label="Savatchaga qo'shish"
            disabled={outOfStock}
            onClick={() => addToCart(product.id)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white shadow-sm transition active:scale-90 disabled:bg-gray-200 disabled:text-gray-400"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
