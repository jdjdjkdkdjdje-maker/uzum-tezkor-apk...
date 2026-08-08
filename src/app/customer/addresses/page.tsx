"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Plus, Pencil, Trash2, Star, X } from "lucide-react";
import { toast } from "sonner";
import { api, type Address } from "@/lib/customer-api";
import { useCustomerStore } from "@/components/customer/Store";
import BottomNav from "@/components/customer/BottomNav";
import { TopBar, EmptyState, ErrorState, ListSkeleton } from "@/components/customer/Shared";

export default function AddressesPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useCustomerStore();
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Address | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", fullAddress: "", apartment: "", entrance: "", floor: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.get<{ addresses: Address[] }>("/api/customer/addresses");
      setAddresses(data.addresses);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik yuz berdi");
    }
  }, []);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.replace("/customer/login?next=/customer/addresses");
      return;
    }
    load();
  }, [user, userLoading, router, load]);

  const openForm = (address?: Address) => {
    if (address) {
      setEditing(address);
      setForm({
        title: address.title,
        fullAddress: address.fullAddress,
        apartment: address.apartment ?? "",
        entrance: address.entrance ?? "",
        floor: address.floor ?? "",
      });
    } else {
      setEditing(null);
      setForm({ title: "", fullAddress: "", apartment: "", entrance: "", floor: "" });
    }
    setShowForm(true);
  };

  const save = async () => {
    if (!form.fullAddress.trim()) {
      toast.error("Manzilni to'liq kiriting");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/api/customer/addresses/${editing.id}`, form);
        toast.success("Manzil yangilandi");
      } else {
        await api.post("/api/customer/addresses", form);
        toast.success("Manzil qo'shildi");
      }
      setShowForm(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Bu manzilni o'chirmoqchimisiz?")) return;
    try {
      await api.delete(`/api/customer/addresses/${id}`);
      toast.success("Manzil o'chirildi");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "O'chirishda xatolik");
    }
  };

  const makeDefault = async (id: number) => {
    try {
      await api.patch(`/api/customer/addresses/${id}`, { isDefault: true });
      toast.success("Asosiy manzil o'zgartirildi");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Xatolik yuz berdi");
    }
  };

  const inputCls =
    "w-full rounded-xl border border-gray-200 bg-gray-50 py-3 px-3.5 text-sm outline-none transition focus:border-green-500 focus:bg-white";

  return (
    <div className="pb-24">
      <TopBar
        title="Manzillarim"
        backHref="/customer/profile"
        right={
          <button
            type="button"
            onClick={() => openForm()}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-600 text-white"
          >
            <Plus size={18} />
          </button>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !addresses ? (
        <ListSkeleton />
      ) : addresses.length === 0 ? (
        <EmptyState
          icon={<MapPin size={36} />}
          title="Manzillar yo'q"
          subtitle="Yetkazib berish uchun manzil qo'shing"
          actionLabel="Manzil qo'shish"
          onAction={() => openForm()}
        />
      ) : (
        <div className="space-y-3 px-4 pt-3">
          {addresses.map((a) => (
            <div key={a.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-extrabold text-gray-900">{a.title}</p>
                  {a.isDefault && (
                    <span className="rounded-lg bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-700">
                      Asosiy
                    </span>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => openForm(a)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-500"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(a.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="mt-1.5 text-sm leading-5 text-gray-600">{a.fullAddress}</p>
              {(a.apartment || a.entrance || a.floor) && (
                <p className="mt-1 text-xs text-gray-400">
                  {[
                    a.apartment && `Xonadon: ${a.apartment}`,
                    a.entrance && `Kirish: ${a.entrance}`,
                    a.floor && `Qavat: ${a.floor}`,
                  ]
                    .filter(Boolean)
                    .join(" • ")}
                </p>
              )}
              {!a.isDefault && (
                <button
                  type="button"
                  onClick={() => makeDefault(a.id)}
                  className="mt-2.5 flex items-center gap-1 text-xs font-bold text-green-600"
                >
                  <Star size={12} /> Asosiy manzil qilish
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Forma modali */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="w-full max-w-md rounded-t-3xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-gray-900">
                {editing ? "Manzilni tahrirlash" : "Yangi manzil"}
              </h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-400">
                <X size={20} />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Nomi (Uy, Ish va h.k.)"
                className={inputCls}
              />
              <textarea
                value={form.fullAddress}
                onChange={(e) => setForm((f) => ({ ...f, fullAddress: e.target.value }))}
                placeholder="To'liq manzil: viloyat, shahar, ko'cha, uy *"
                rows={2}
                className={inputCls}
              />
              <div className="grid grid-cols-3 gap-2.5">
                <input
                  type="text"
                  value={form.apartment}
                  onChange={(e) => setForm((f) => ({ ...f, apartment: e.target.value }))}
                  placeholder="Xonadon"
                  className={inputCls}
                />
                <input
                  type="text"
                  value={form.entrance}
                  onChange={(e) => setForm((f) => ({ ...f, entrance: e.target.value }))}
                  placeholder="Kirish"
                  className={inputCls}
                />
                <input
                  type="text"
                  value={form.floor}
                  onChange={(e) => setForm((f) => ({ ...f, floor: e.target.value }))}
                  placeholder="Qavat"
                  className={inputCls}
                />
              </div>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="mt-4 w-full rounded-2xl bg-green-600 py-3.5 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-60"
            >
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
