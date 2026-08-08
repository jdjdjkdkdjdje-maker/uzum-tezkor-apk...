import type { Metadata } from "next";
import "./globals.css";

// Eslatma: Google Fonts (Geist) tarmoq yopiq muhitlarda build xatosiga olib kelgani
// uchun xavfsiz tizim shriftlariga o'tkazildi. UI o'zgarmaydi — globals.css dagi
// --font-geist-sans o'zgaruvchisi saqlab qolindi.
const fontVariables = "antialiased bg-gray-50";

export const metadata: Metadata = {
  title: "Baraka Market — Admin Panel",
  description: "Baraka Market supermarket admin boshqaruv paneli",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <body className={fontVariables} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
