import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import { cookies } from "next/headers";
import { LANG_COOKIE_KEY } from "@/lib/i18n/config";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import type { Language } from "@/lib/i18n/translations";
import "./globals.css";

const interTight = Inter_Tight({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TrustLink",
  description: "Blockchain-verified credentials for hiring",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const cookieLang = cookieStore.get(LANG_COOKIE_KEY)?.value;
  const initialLang: Language =
    cookieLang === "en" || cookieLang === "vi" ? cookieLang : "vi";

  return (
    <html
      lang={initialLang}
      data-theme="light"
      className={interTight.variable}
      suppressHydrationWarning
    >
      <body>
        <LanguageProvider initialLang={initialLang}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
