# Baraka Market — Mijozlar ilovasi (Customer App)

Mavjud Baraka Market admin paneli bilan **bitta Next.js loyihasi va bitta PostgreSQL bazasi**da
ishlaydigan, mobil-first mijozlar ilovasi. Admin panel kodi o'zgartirilmagan — mijozlar ilovasi
alohida modul sifatida qo'shilgan.

## Tuzilma

```
src/
  app/
    customer/            ← Mijozlar ilovasi sahifalari (UI to'liq o'zbek tilida)
      page.tsx           ← Splash screen (sessiya tekshiruvi + animatsiya)
      onboarding/        ← 3 sahifali onboarding (faqat birinchi kirishda)
      login/ register/   ← Autentifikatsiya
      home/              ← Bosh sahifa (bannerlar, kategoriyalar, aksiyalar, mahsulotlar)
      categories/        ← Kategoriyalar katalogi
      products/          ← Mahsulotlar ro'yxati (filtr, saralash, pagination)
      products/[id]/     ← Mahsulot tafsiloti (galereya, sharhlar, o'xshashlar)
      search/            ← Qidiruv (tarix, debounce, empty state)
      favorites/         ← Sevimlilar (server bilan sinxron)
      cart/              ← Savatcha (kupon, ombor tekshiruvi)
      checkout/          ← Rasmiylashtirish (manzil, yetkazish, to'lov)
      order-success/[id] ← "Buyurtmangiz qabul qilindi!" sahifasi
      orders/            ← Buyurtmalarim (avtomatik status yangilanishi)
      orders/[id]/       ← Buyurtma tafsiloti (status timeline, bekor qilish, sharh)
      profile/ addresses/ notifications/ settings/ help/ about/
    api/customer/        ← Mijozlar API endpointlari
      auth/              ← register, login, logout, me (profil)
      home/ products/ categories/ cart/ wishlist/ addresses/
      coupons/validate/ orders/ reviews/ notifications/ search-history/
  components/customer/   ← Store (global holat), BottomNav, ProductCard, Shared (skeleton/empty/error)
  lib/
    customer-auth.ts     ← Sessiya (httpOnly cookie + refresh_tokens jadvali), scrypt parol hash
    customer-products.ts ← Mahsulot kartalari uchun umumiy so'rovlar
    customer-coupons.ts  ← Kupon tekshiruvi (muddat, limit, min summa, per-user limit)
    customer-api.ts      ← Klient API wrapper (xatolar o'zbek tilida)
    customer-format.ts   ← Narx/sana/status formatlash
```

## Ishga tushirish

```bash
cp .env.example .env      # DATABASE_URL ni to'ldiring
npm install
npx drizzle-kit push      # sxemani bazaga qo'llash
npm run dev               # http://localhost:3000
```

- Admin panel: `/dashboard`
- Mijozlar ilovasi: `/customer`
- Demo ma'lumotlar: `POST /api/seed`

## Xavfsizlik

- Sessiya `httpOnly` cookie'da saqlanadi (`refresh_tokens` jadvali, 30 kun).
- Parollar `scrypt` bilan hash qilinadi (`users.password_hash` — mavjud sxemaga qo'shilgan yagona ustun).
- Mijoz faqat o'z buyurtmalari, manzillari, savati va bildirishnomalarini ko'radi.
- Narxlar, chegirmalar, yetkazib berish narxi va yakuniy summa **faqat serverda** hisoblanadi.
- Ombor qoldig'i buyurtma paytida tranzaksiya ichida `FOR UPDATE` bilan qulflab tekshiriladi —
  qoldiqdan ortiq buyurtma berib bo'lmaydi.

## Mavjud tizim bilan integratsiya

| Oqim | Qanday ishlaydi |
|---|---|
| Mahsulot/kategoriya/banner/aksiya | Bitta bazadan, faqat faol yozuvlar ko'rsatiladi |
| Savat | `cart_items` jadvalida, serverda saqlanadi |
| Buyurtma | `orders` + `order_items` + `order_status_history` + ombordan ayirish |
| Status o'zgarishi | Admin statusni o'zgartirsa mijozga bildirishnoma tushadi, ilova polling orqali yangilanadi |
| Sharh | Faqat yetkazib berilgan buyurtma mahsulotiga; reyting avtomatik qayta hisoblanadi |
| Kupon | `coupons` + `coupon_usage`, barcha limitlar serverda tekshiriladi |
| To'lov | Hozircha real mavjud usullar: naqd va bank kartasi (yetkazilganda). Payme/Click integratsiyasi qo'shilsa, `PAYMENT_METHODS` ro'yxatiga qo'shish kifoya |

## Android haqida

Bu muhitda Flutter SDK mavjud emas, shuning uchun mijozlar ilovasi mobil-first PWA-uslubidagi
web-ilova sifatida qurilgan (istalgan telefon brauzerida ilovadek ishlaydi). Uni Android ilovaga
aylantirishning eng tez yo'li — TWA (Trusted Web Activity) yoki Capacitor:

```bash
npm install @capacitor/core @capacitor/android
npx cap init "Baraka Market" uz.barakamarket.app
# capacitor.config: server.url = https://SIZNING-DOMEN/customer
npx cap add android && npx cap open android
```
