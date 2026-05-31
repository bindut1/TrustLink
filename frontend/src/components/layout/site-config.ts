import type { TranslationKey } from "@/lib/i18n/translations";

/** Top-level public navigation. Labels are i18n keys. */
export const PUBLIC_NAV: { labelKey: TranslationKey; href: string }[] = [
  { labelKey: "publicNav.product", href: "/product" },
  { labelKey: "publicNav.howItWorks", href: "/how-it-works" },
  { labelKey: "publicNav.pricing", href: "/pricing" },
  { labelKey: "publicNav.docs", href: "/docs" },
];

/** Footer link columns. */
export const FOOTER_COLUMNS: {
  titleKey: TranslationKey;
  links: { labelKey: TranslationKey; href: string }[];
}[] = [
  {
    titleKey: "footer.colProduct",
    links: [
      { labelKey: "footer.product.candidates", href: "/candidates" },
      { labelKey: "footer.product.recruiters", href: "/recruiters" },
      { labelKey: "footer.product.institutions", href: "/institutions" },
      { labelKey: "footer.product.pricing", href: "/pricing" },
    ],
  },
  {
    titleKey: "footer.colCompany",
    links: [
      { labelKey: "footer.company.about", href: "/about" },
      { labelKey: "footer.company.careers", href: "/careers" },
      { labelKey: "footer.company.contact", href: "/contact" },
    ],
  },
  {
    titleKey: "footer.colResources",
    links: [
      { labelKey: "footer.resources.docs", href: "/docs" },
      { labelKey: "footer.resources.api", href: "/docs/api" },
      { labelKey: "footer.resources.changelog", href: "/changelog" },
      { labelKey: "footer.resources.status", href: "/status" },
    ],
  },
  {
    titleKey: "footer.colLegal",
    links: [
      { labelKey: "footer.legal.privacy", href: "/privacy" },
      { labelKey: "footer.legal.terms", href: "/terms" },
      { labelKey: "footer.legal.security", href: "/security" },
    ],
  },
];

/** Social links — brand names stay as-is. */
export const SOCIAL_LINKS = [
  { label: "GitHub", href: "https://github.com" },
  { label: "Twitter", href: "https://twitter.com" },
  { label: "LinkedIn", href: "https://linkedin.com" },
];
