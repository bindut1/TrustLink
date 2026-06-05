import type { Metadata } from "next";
import { Hanken_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { LANG_COOKIE_KEY } from "@/lib/i18n/config";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import type { Language } from "@/lib/i18n/translations";
import "./globals.css";

// UI typeface — headings + body (DESIGN_SPEC --font-ui)
const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  display: "swap",
});

// Mono typeface — hashes, match scores, credential IDs, block numbers
// (DESIGN_SPEC --font-mono). Teal is reserved for verified/on-chain; mono is
// reserved for machine values.
const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
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
      className={`${hankenGrotesk.variable} ${ibmPlexMono.variable} font-sans`}
      suppressHydrationWarning
    >
      <body>
        <LanguageProvider initialLang={initialLang}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
