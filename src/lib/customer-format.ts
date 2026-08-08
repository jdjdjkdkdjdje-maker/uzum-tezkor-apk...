// Mijozlar ilovasi uchun formatlash yordamchilari (UI — o'zbek tilida)

export function fmtSum(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "0 so'm";
  return `${Math.round(value).toLocaleString("en-US").replace(/,/g, " ")} so'm`;
}

export function fmtDate(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  const months = [
    "yanvar", "fevral", "mart", "aprel", "may", "iyun",
    "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr",
  ];
  return `${d.getDate()}-${months[d.getMonth()]}, ${d.getFullYear()}`;
}

export function fmtDateTime(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${fmtDate(d)} ${hh}:${mm}`;
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Kutilmoqda",
  confirmed: "Tasdiqlandi",
  preparing: "Tayyorlanmoqda",
  ready: "Tayyor",
  picked_up: "Kuryer oldi",
  delivering: "Yetkazilmoqda",
  delivered: "Yetkazildi",
  cancelled: "Bekor qilindi",
  returned: "Qaytarildi",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  preparing: "bg-indigo-100 text-indigo-700",
  ready: "bg-cyan-100 text-cyan-700",
  picked_up: "bg-purple-100 text-purple-700",
  delivering: "bg-sky-100 text-sky-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  returned: "bg-gray-100 text-gray-700",
};

export const ORDER_STATUS_FLOW = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "picked_up",
  "delivering",
  "delivered",
];

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Naqd pul",
  card: "Bank kartasi (yetkazilganda)",
  wallet: "Hamyon",
  payme: "Payme",
  click: "Click",
  uzum: "Uzum",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "To'lov kutilmoqda",
  paid: "To'langan",
  failed: "To'lov amalga oshmadi",
  refunded: "Qaytarilgan",
};

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "Xayrli tun";
  if (h < 12) return "Xayrli tong";
  if (h < 18) return "Xayrli kun";
  return "Xayrli kech";
}
