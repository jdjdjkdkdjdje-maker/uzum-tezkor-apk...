"use client";

import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/customer-api";

export type CustomerUser = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  phone: string;
  email: string | null;
  avatar: string | null;
  gender?: string | null;
  birthDate?: string | null;
  bonusPoints?: number;
  walletBalance?: number;
  createdAt?: string;
};

type MeResponse = {
  user: CustomerUser;
  cartCount: number;
  unreadNotifications: number;
  favoriteIds: number[];
};

type StoreContextValue = {
  user: CustomerUser | null;
  loading: boolean;
  cartCount: number;
  unreadNotifications: number;
  favoriteIds: Set<number>;
  refreshMe: () => Promise<void>;
  setCartCount: (n: number) => void;
  setUser: (u: CustomerUser | null) => void;
  toggleFavorite: (productId: number) => Promise<boolean | null>;
  addToCart: (productId: number, quantity?: number) => Promise<boolean>;
  logout: () => Promise<void>;
  requireAuth: (next?: string) => boolean;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function CustomerStoreProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());

  const refreshMe = useCallback(async () => {
    try {
      const data = await api.get<MeResponse>("/api/customer/auth/me");
      setUser(data.user);
      setCartCount(data.cartCount);
      setUnreadNotifications(data.unreadNotifications);
      setFavoriteIds(new Set(data.favoriteIds));
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setUser(null);
        setCartCount(0);
        setUnreadNotifications(0);
        setFavoriteIds(new Set());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const requireAuth = useCallback(
    (next?: string) => {
      if (user) return true;
      if (!loading) {
        toast.error("Avval tizimga kiring");
        router.push(`/customer/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
      }
      return false;
    },
    [user, loading, router]
  );

  const toggleFavorite = useCallback(
    async (productId: number): Promise<boolean | null> => {
      if (!user) {
        toast.error("Sevimlilarga qo'shish uchun tizimga kiring");
        router.push(`/customer/login`);
        return null;
      }
      try {
        const data = await api.post<{ added: boolean; favoriteIds: number[] }>(
          "/api/customer/wishlist",
          { productId }
        );
        setFavoriteIds(new Set(data.favoriteIds));
        toast.success(data.added ? "Sevimlilarga qo'shildi" : "Sevimlilardan olib tashlandi");
        return data.added;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Xatolik yuz berdi");
        return null;
      }
    },
    [user, router]
  );

  const addToCart = useCallback(
    async (productId: number, quantity = 1): Promise<boolean> => {
      if (!user) {
        toast.error("Savatchaga qo'shish uchun tizimga kiring");
        router.push(`/customer/login`);
        return false;
      }
      try {
        const data = await api.post<{ cart: { count: number } }>("/api/customer/cart", {
          productId,
          quantity,
        });
        setCartCount(data.cart.count);
        toast.success("Savatchaga qo'shildi");
        return true;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Xatolik yuz berdi");
        return false;
      }
    },
    [user, router]
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/api/customer/auth/logout");
    } catch {
      // baribir chiqamiz
    }
    setUser(null);
    setCartCount(0);
    setUnreadNotifications(0);
    setFavoriteIds(new Set());
    router.push("/customer/login");
  }, [router]);

  const value = useMemo(
    () => ({
      user, loading, cartCount, unreadNotifications, favoriteIds,
      refreshMe, setCartCount, setUser, toggleFavorite, addToCart, logout, requireAuth,
    }),
    [user, loading, cartCount, unreadNotifications, favoriteIds, refreshMe, toggleFavorite, addToCart, logout, requireAuth]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useCustomerStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useCustomerStore faqat CustomerStoreProvider ichida ishlaydi");
  return ctx;
}
