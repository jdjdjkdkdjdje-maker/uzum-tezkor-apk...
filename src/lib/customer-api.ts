"use client";

// Mijozlar ilovasi uchun API klient — xatolar o'zbek tilida

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
      credentials: "same-origin",
    });
  } catch {
    throw new ApiError(
      "Internet aloqasi yo'q. Ulanishni tekshirib, qayta urinib ko'ring.",
      0
    );
  }

  let data: Record<string, unknown> = {};
  try {
    data = await res.json();
  } catch {
    // json bo'lmasa ham davom etamiz
  }

  if (!res.ok) {
    const message =
      (typeof data.error === "string" && data.error) ||
      (res.status === 401
        ? "Avval tizimga kiring"
        : res.status === 404
        ? "Ma'lumot topilmadi"
        : res.status >= 500
        ? "Serverda xatolik yuz berdi. Birozdan so'ng qayta urinib ko'ring."
        : "Xatolik yuz berdi");
    throw new ApiError(message, res.status);
  }

  return data as T;
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: "POST", body: body != null ? JSON.stringify(body) : undefined }),
  patch: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: "PATCH", body: body != null ? JSON.stringify(body) : undefined }),
  delete: <T>(url: string) => request<T>(url, { method: "DELETE" }),
};

// ─── Umumiy turlar ────────────────────────────────────────────────────────────
export type ProductCard = {
  id: number;
  name: string;
  slug: string;
  price: number;
  oldPrice: number | null;
  discountPercent: number | null;
  status: string;
  isFeatured: boolean;
  isNew: boolean;
  averageRating: number | null;
  reviewCount: number;
  totalSold: number;
  categoryName: string | null;
  brandName: string | null;
  available: number;
  image: string | null;
};

export type Category = {
  id: number;
  parentId?: number | null;
  name: string;
  slug: string;
  image: string | null;
  icon: string | null;
  color: string | null;
  productCount: number;
};

export type Banner = {
  id: number;
  title: string;
  subtitle: string | null;
  image: string;
  mobileImage: string | null;
  link: string | null;
  type: string;
};

export type Promotion = {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
  discountType: string;
  discountValue: number;
  endsAt: string;
};

export type CartData = {
  items: Array<{
    id: number;
    productId: number;
    name: string;
    image: string | null;
    price: number;
    oldPrice: number | null;
    quantity: number;
    available: number;
    isActive: boolean;
    lineTotal: number;
  }>;
  subtotal: number;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  minOrderAmount: number;
  total: number;
  count: number;
};

export type Address = {
  id: number;
  title: string;
  fullAddress: string;
  apartment: string | null;
  entrance: string | null;
  floor: string | null;
  isDefault: boolean;
};

export type OrderSummary = {
  id: number;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  couponDiscount: number;
  totalAmount: number;
  deliveryAddress: string | null;
  createdAt: string;
  deliveredAt: string | null;
  items: Array<{
    id: number;
    productId: number;
    productName: string;
    productImage: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
};
