"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Phone } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/customer-api";
import { useCustomerStore, type CustomerUser } from "@/components/customer/Store";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshMe } = useCustomerStore();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      toast.error("Telefon/email va parolni kiriting");
      return;
    }
    setSubmitting(true);
    try {
      await api.post<{ user: CustomerUser }>("/api/customer/auth/login", {
        identifier: identifier.trim(),
        password,
      });
      await refreshMe();
      toast.success("Xush kelibsiz!");
      router.replace(searchParams.get("next") || "/customer/home");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Kirishda xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-white px-6 pb-8 pt-14">
      <div className="mb-8 flex flex-col items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Baraka Market" className="h-20 w-20 rounded-3xl shadow-lg" />
        <h1 className="mt-4 text-2xl font-extrabold text-gray-900">Xush kelibsiz!</h1>
        <p className="mt-1 text-sm text-gray-500">Hisobingizga kiring</p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            Telefon raqam yoki email
          </label>
          <div className="relative">
            <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              inputMode="tel"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="+998 90 123 45 67"
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 text-[15px] outline-none transition focus:border-green-500 focus:bg-white"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">Parol</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Parolingiz"
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3.5 pl-4 pr-12 text-[15px] outline-none transition focus:border-green-500 focus:bg-white"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            toast.info("Parolni tiklash uchun yordam markaziga murojaat qiling: +998 71 200 20 20")
          }
          className="self-end text-sm font-semibold text-green-600"
        >
          Parolni unutdingizmi?
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 w-full rounded-2xl bg-green-600 py-4 text-base font-bold text-white shadow-lg shadow-green-600/30 transition active:scale-[0.98] disabled:opacity-60"
        >
          {submitting ? "Kirilmoqda..." : "Kirish"}
        </button>
      </form>

      <p className="mt-auto pt-8 text-center text-sm text-gray-500">
        Hisobingiz yo&apos;qmi?{" "}
        <Link href="/customer/register" className="font-bold text-green-600">
          Ro&apos;yxatdan o&apos;tish
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
