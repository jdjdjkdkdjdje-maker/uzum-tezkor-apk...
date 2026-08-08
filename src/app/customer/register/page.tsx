"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/customer-api";
import { useCustomerStore, type CustomerUser } from "@/components/customer/Store";

export default function RegisterPage() {
  const router = useRouter();
  const { refreshMe } = useCustomerStore();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim()) return toast.error("Ismingizni kiriting");
    if (!form.phone.trim()) return toast.error("Telefon raqamingizni kiriting");
    if (form.password.length < 6)
      return toast.error("Parol kamida 6 ta belgidan iborat bo'lishi kerak");

    setSubmitting(true);
    try {
      await api.post<{ user: CustomerUser }>("/api/customer/auth/register", {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        password: form.password,
      });
      await refreshMe();
      toast.success("Ro'yxatdan o'tdingiz! Xush kelibsiz!");
      router.replace("/customer/home");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ro'yxatdan o'tishda xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "w-full rounded-2xl border border-gray-200 bg-gray-50 py-3.5 px-4 text-[15px] outline-none transition focus:border-green-500 focus:bg-white";

  return (
    <div className="flex min-h-dvh flex-col bg-white px-6 pb-8 pt-10">
      <div className="mb-6 flex flex-col items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Baraka Market" className="h-16 w-16 rounded-2xl shadow-lg" />
        <h1 className="mt-3 text-2xl font-extrabold text-gray-900">Ro&apos;yxatdan o&apos;tish</h1>
        <p className="mt-1 text-sm text-gray-500">Bir daqiqada hisob yarating</p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3.5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Ism *</label>
            <input type="text" value={form.firstName} onChange={set("firstName")} placeholder="Ismingiz" className={inputCls} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Familiya</label>
            <input type="text" value={form.lastName} onChange={set("lastName")} placeholder="Familiyangiz" className={inputCls} />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">Telefon raqam *</label>
          <input type="tel" inputMode="tel" value={form.phone} onChange={set("phone")} placeholder="+998 90 123 45 67" className={inputCls} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            Email <span className="font-normal text-gray-400">(ixtiyoriy)</span>
          </label>
          <input type="email" value={form.email} onChange={set("email")} placeholder="siz@example.com" className={inputCls} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">Parol *</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={set("password")}
              placeholder="Kamida 6 ta belgi"
              className={`${inputCls} pr-12`}
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
          type="submit"
          disabled={submitting}
          className="mt-2 w-full rounded-2xl bg-green-600 py-4 text-base font-bold text-white shadow-lg shadow-green-600/30 transition active:scale-[0.98] disabled:opacity-60"
        >
          {submitting ? "Yaratilmoqda..." : "Hisob yaratish"}
        </button>
      </form>

      <p className="mt-auto pt-6 text-center text-sm text-gray-500">
        Hisobingiz bormi?{" "}
        <Link href="/customer/login" className="font-bold text-green-600">
          Kirish
        </Link>
      </p>
    </div>
  );
}
