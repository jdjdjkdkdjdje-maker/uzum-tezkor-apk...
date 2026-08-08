"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingBasket } from "lucide-react";

// Rasm yuklanmasa — brendlangan placeholder ko'rsatadigan xavfsiz rasm komponenti
export function SafeImg({
  src,
  alt,
  className,
  iconSize = 28,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  iconSize?: number;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <span
        className={`flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 text-green-300 ${className ?? ""}`}
      >
        <ShoppingBasket size={iconSize} strokeWidth={1.5} />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

export function TopBar({
  title,
  right,
  backHref,
}: {
  title: string;
  right?: React.ReactNode;
  backHref?: string;
}) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-gray-100 bg-white/95 px-3 py-3 backdrop-blur-md">
      {backHref ? (
        <Link
          href={backHref}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 text-gray-700"
        >
          <ArrowLeft size={20} />
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 text-gray-700"
        >
          <ArrowLeft size={20} />
        </button>
      )}
      <h1 className="flex-1 truncate text-base font-bold text-gray-900">{title}</h1>
      {right}
    </header>
  );
}

export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  actionHref,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-green-50 text-green-500">
        {icon}
      </div>
      <h3 className="text-base font-bold text-gray-900">{title}</h3>
      {subtitle && <p className="mt-1 max-w-[260px] text-sm text-gray-500">{subtitle}</p>}
      {actionLabel &&
        (actionHref ? (
          <Link
            href={actionHref}
            className="mt-5 rounded-2xl bg-green-600 px-6 py-3 text-sm font-semibold text-white active:scale-95"
          >
            {actionLabel}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onAction}
            className="mt-5 rounded-2xl bg-green-600 px-6 py-3 text-sm font-semibold text-white active:scale-95"
          >
            {actionLabel}
          </button>
        ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-3xl">
        ⚠️
      </div>
      <h3 className="text-base font-bold text-gray-900">Xatolik yuz berdi</h3>
      <p className="mt-1 max-w-[280px] text-sm text-gray-500">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-2xl bg-green-600 px-6 py-3 text-sm font-semibold text-white active:scale-95"
        >
          Qayta urinish
        </button>
      )}
    </div>
  );
}

// ─── Skeletonlar ───────────────────────────────────────────────────────────────
export function Shimmer({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-200/70 ${className ?? ""}`} />;
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl bg-white p-0 shadow-sm ring-1 ring-gray-100">
          <Shimmer className="aspect-square rounded-none" />
          <div className="space-y-2 p-2.5">
            <Shimmer className="h-3 w-3/4" />
            <Shimmer className="h-3 w-1/2" />
            <Shimmer className="h-4 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div className="space-y-4 px-4 pt-3">
      <Shimmer className="h-40 w-full rounded-2xl" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <Shimmer key={i} className="h-20 w-20 shrink-0 rounded-2xl" />
        ))}
      </div>
      <Shimmer className="h-5 w-40" />
      <ProductGridSkeleton count={4} />
    </div>
  );
}

export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3 px-4 pt-3">
      {Array.from({ length: count }).map((_, i) => (
        <Shimmer key={i} className="h-24 w-full rounded-2xl" />
      ))}
    </div>
  );
}
