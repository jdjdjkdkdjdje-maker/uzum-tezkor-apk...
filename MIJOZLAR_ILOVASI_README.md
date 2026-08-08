# BARAKA MARKET — Mijozlar ilovasi fayllari

Bu arxivda mijozlar ilovasining BARCHA fayllari bor. Ular mavjud Baraka Market
(Next.js + Drizzle + PostgreSQL) loyihasi ichiga shu tartibda joylashadi:

ARXIV ICHIDAGI YO'L                      →  LOYIHADAGI JOYI
─────────────────────────────────────────────────────────────
src/app/customer/**                      →  Mijoz sahifalari (/customer)
src/app/api/customer/**                  →  Mijoz API endpointlari (/api/customer)
src/components/customer/**               →  Store, BottomNav, ProductCard, Shared
src/lib/customer-auth.ts                 →  Sessiya + parol (scrypt, httpOnly cookie)
src/lib/customer-api.ts                  →  Klient API wrapper (xatolar o'zbekcha)
src/lib/customer-format.ts               →  Narx/sana/status formatlash
src/lib/customer-products.ts             →  Mahsulot kartalari uchun umumiy so'rovlar
src/lib/customer-coupons.ts              →  Kupon tekshiruvi
src/db/schema.ts                         →  Baza sxemasi (users.password_hash qo'shilgan)
src/db/index.ts                          →  Baza ulanishi
public/logo.png                          →  Ilova logotipi
public/img/**                            →  Mahsulot va banner rasmlari
CUSTOMER_APP.md                          →  To'liq hujjat
.env.example                             →  Muhit sozlamalari namunasi
package.json                             →  Bog'liqliklar

O'RNATISH (yangi serverda):
1. Fayllarni loyiha ildiziga ko'chiring (mavjud fayllar ustiga yozish xavfsiz —
   admin qismiga tegilmagan, faqat src/db/schema.ts da bitta yangi ustun bor).
2. cp .env.example .env  →  DATABASE_URL ni to'ldiring
3. npm install
4. npx drizzle-kit push        # password_hash ustunini qo'shadi
5. npm run dev  yoki  npm run build && npm start
6. Mijozlar ilovasi: http://localhost:3000/customer
   Admin panel:      http://localhost:3000/dashboard

ESLATMA: Bitta o'zgartirilgan mavjud fayl — src/app/api/orders/[id]/route.ts
(admin status o'zgartirganda mijozga bildirishnoma yuboradi). U ham arxivda bor.
src/app/layout.tsx da Google Fonts tizim shriftiga almashtirilgan (yopiq
tarmoqlarda build ishlashi uchun).
