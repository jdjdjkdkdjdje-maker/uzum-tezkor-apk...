"use client";

import { Bell, Globe, Moon, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import BottomNav from "@/components/customer/BottomNav";
import { TopBar } from "@/components/customer/Shared";

export default function SettingsPage() {
  return (
    <div className="pb-24">
      <TopBar title="Sozlamalar" backHref="/customer/profile" />

      <div className="space-y-3 px-4 pt-3">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center gap-3.5 px-4 py-3.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <Globe size={18} />
            </span>
            <span className="flex-1 text-sm font-semibold text-gray-800">Til</span>
            <span className="text-sm text-gray-400">O&apos;zbekcha</span>
            <ChevronRight size={16} className="text-gray-300" />
          </div>
          <button
            type="button"
            onClick={() => toast.info("Bildirishnoma sozlamalari qurilma sozlamalarida boshqariladi")}
            className="flex w-full items-center gap-3.5 border-t border-gray-50 px-4 py-3.5 text-left"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <Bell size={18} />
            </span>
            <span className="flex-1 text-sm font-semibold text-gray-800">Bildirishnomalar</span>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
          <button
            type="button"
            onClick={() => toast.info("Tungi rejim tez orada qo'shiladi")}
            className="flex w-full items-center gap-3.5 border-t border-gray-50 px-4 py-3.5 text-left"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <Moon size={18} />
            </span>
            <span className="flex-1 text-sm font-semibold text-gray-800">Tungi rejim</span>
            <span className="text-sm text-gray-400">O&apos;chiq</span>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
