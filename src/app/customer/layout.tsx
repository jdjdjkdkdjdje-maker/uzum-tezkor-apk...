import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { CustomerStoreProvider } from "@/components/customer/Store";

export const metadata: Metadata = {
  title: "Baraka Market — Onlayn do'kon",
  description: "Baraka Market — oziq-ovqat va uy-ro'zg'or mahsulotlari yetkazib berish xizmati",
  icons: { icon: "/logo.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#16a34a",
};

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-gray-100">
      <div className="relative mx-auto min-h-dvh w-full max-w-md bg-gray-50 shadow-2xl">
        <CustomerStoreProvider>
          {children}
          <Toaster
            position="top-center"
            richColors
            toastOptions={{ style: { borderRadius: "14px" } }}
          />
        </CustomerStoreProvider>
      </div>
    </div>
  );
}
