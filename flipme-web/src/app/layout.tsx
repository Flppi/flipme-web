import type { Metadata } from "next";
import { Noto_Sans_KR, Outfit } from "next/font/google";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import "@/styles/globals.css";

const fontDisplay = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const fontBody = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: "FlipMe — 사진이 음악이 되는 순간",
  description:
    "사진 분위기에 맞는 음악을 추천하고 인스타그램 공유 카드를 만드는 FlipMe",
  openGraph: {
    title: "FlipMe — 사진이 음악이 되는 순간",
    description:
      "사진 분위기에 맞는 음악을 추천하고 인스타그램 공유 카드를 만드는 FlipMe",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FlipMe — 사진이 음악이 되는 순간",
    description:
      "사진 분위기에 맞는 음악을 추천하고 인스타그램 공유 카드를 만드는 FlipMe",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${fontDisplay.variable} ${fontBody.variable} flex min-h-screen flex-col font-body`}
      >
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
