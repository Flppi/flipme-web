import type { Metadata } from "next";
import { Noto_Sans_KR, Outfit } from "next/font/google";
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

export const metadata: Metadata = {
  title: "FlipMe — 사진이 음악이 되는 순간",
  description:
    "사진 분위기에 맞는 음악을 추천하고 인스타그램 공유 카드를 만드는 FlipMe",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${fontDisplay.variable} ${fontBody.variable} font-body`}
      >
        {children}
      </body>
    </html>
  );
}
