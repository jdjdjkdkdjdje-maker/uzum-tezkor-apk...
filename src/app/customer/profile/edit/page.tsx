"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/customer-api";
import { useCustomerStore } from "@/components/customer/Store";
import BottomNav from "@/components/customer/BottomNav";
import { TopBar, ListSkeleton } from "@/components/customer/Shared";

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, loading, refreshMe } = useCustomerStore();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "" });
  const [passwords, setPasswords] = useState({ current: "", next: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/customer/login?next=/customer/profile/edit");
      return;
    }
    setForm({
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      email: user.email ?? "",
    });
  }, [user, loading, router]);

  const save = async () => {
    if (!form.firstName.trim()) {
      toast.error("Ismingizni kiriting");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, string> = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
      };
      if (passwords.next) {
        payload.currentPassword = passwords.current;
        payload.newPassword = passwords.next;
      }
      await api.patch("/api/customer/auth/me", payload);
      await refreshMe();
      toast.success("Ma'lumotlar saqlandi");
      setPasswords({ current: "", next: "" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full rounded-2xl border border-gray-200 bg-gray-50 py-3.5 px-4 text-[15px] outline-none transition focus:border-green-500 focus:bg-white";

  return (
    <div className="pb-24">
      <TopBar title="Shaxsiy ma'lumotlar" backHref="/customer/profile" />

      {loading || !user ? (
        <ListSkeleton />
      ) : (
        <div className="space-y-4 px-4 pt-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Ism</label>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Familiya</label>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Telefon raqam</label>
            <input type="tel" value={user.phone} disabled className={`${inputCls} opacity-60`} />
            <p className="mt-1 text-xs text-gray-400">Telefon raqamni o&apos;zgartirib bo&apos;lmaydi</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="siz@example.com"
              className={inputCls}
            />
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-sm font-extrabold text-gray-900">Parolni o&apos;zgartirish</h2>
            <div className="mt-3 space-y-3">
              <input
                type="password"
                value={passwords.current}
                onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
                placeholder="Joriy parol"
                className={inputCls}
              />
              <input
                type="password"
                value={passwords.next}
                onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
                placeholder="Yangi parol (kamida 6 belgi)"
                className={inputCls}
              />
            </div>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={save}
            className="w-full rounded-2xl bg-green-600 py-4 text-base font-bold text-white shadow-lg shadow-green-600/30 active:scale-[0.98] disabled:opacity-60"
          >
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
