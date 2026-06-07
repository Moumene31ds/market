import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({ subsets: ["arabic"], weight: ["300", "400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "نظام المبيعات ونقاط البيع الذكي | POS Terminal",
  description: "نظام سحابي متكامل لإدارة المبيعات، الفواتير، الأرباح، والمخزون للمحلات التجارية والشركات.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.className} bg-slate-950 text-slate-100 antialiased min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
