/**
 * Content config for the landing page. Strings reference i18n keys — see
 * `frontend/src/lib/i18n/translations.ts` for the actual VN/EN copy.
 */

import type { TranslationKey } from "@/lib/i18n/translations";

export type RoleSectionContent = {
  key: string;
  eyebrowKey: TranslationKey;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  bulletKeys: TranslationKey[];
  cta: { labelKey: TranslationKey; href: string };
  image: { src: string; altKey: TranslationKey };
};

const UNSPLASH = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?w=${w}&auto=format&fit=crop&q=75`;

export const HERO_IMAGE: { src: string; altKey: TranslationKey } = {
  src: UNSPLASH("photo-1521737711867-e3b97375f902", 1600),
  altKey: "landing.hero.heroImageAlt",
};

/** Partner logo strip — text-only placeholders. Names stay as-is (brands). */
export const TRUSTED_BY = [
  "Mercurial Labs",
  "ETH Zürich",
  "OpenZeppelin",
  "Polygon",
  "Secureum",
  "MIT Bootcamps",
];

export const ROLE_SECTIONS: RoleSectionContent[] = [
  {
    key: "candidates",
    eyebrowKey: "landing.role.candidates.eyebrow",
    titleKey: "landing.role.candidates.title",
    descriptionKey: "landing.role.candidates.description",
    bulletKeys: [
      "landing.role.candidates.bullet1",
      "landing.role.candidates.bullet2",
      "landing.role.candidates.bullet3",
    ],
    cta: { labelKey: "landing.role.candidates.cta", href: "/register" },
    image: {
      src: UNSPLASH("photo-1517245386807-bb43f82c33c4", 1200),
      altKey: "landing.role.candidates.imageAlt",
    },
  },
  {
    key: "recruiters",
    eyebrowKey: "landing.role.recruiters.eyebrow",
    titleKey: "landing.role.recruiters.title",
    descriptionKey: "landing.role.recruiters.description",
    bulletKeys: [
      "landing.role.recruiters.bullet1",
      "landing.role.recruiters.bullet2",
      "landing.role.recruiters.bullet3",
    ],
    cta: { labelKey: "landing.role.recruiters.cta", href: "/register" },
    image: {
      src: UNSPLASH("photo-1556761175-5973dc0f32e7", 1200),
      altKey: "landing.role.recruiters.imageAlt",
    },
  },
  {
    key: "issuers",
    eyebrowKey: "landing.role.issuers.eyebrow",
    titleKey: "landing.role.issuers.title",
    descriptionKey: "landing.role.issuers.description",
    bulletKeys: [
      "landing.role.issuers.bullet1",
      "landing.role.issuers.bullet2",
      "landing.role.issuers.bullet3",
    ],
    cta: { labelKey: "landing.role.issuers.cta", href: "/register" },
    image: {
      src: UNSPLASH("photo-1523050854058-8df90110c9f1", 1200),
      altKey: "landing.role.issuers.imageAlt",
    },
  },
];

/** "How it works" — 3 steps. */
export const HOW_IT_WORKS: {
  step: string;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
}[] = [
  {
    step: "01",
    titleKey: "landing.how.step1.title",
    descriptionKey: "landing.how.step1.description",
  },
  {
    step: "02",
    titleKey: "landing.how.step2.title",
    descriptionKey: "landing.how.step2.description",
  },
  {
    step: "03",
    titleKey: "landing.how.step3.title",
    descriptionKey: "landing.how.step3.description",
  },
];

export const STATS: {
  valueKey: TranslationKey;
  labelKey: TranslationKey;
}[] = [
  { valueKey: "landing.stats.value1", labelKey: "landing.stats.label1" },
  { valueKey: "landing.stats.value2", labelKey: "landing.stats.label2" },
  { valueKey: "landing.stats.value3", labelKey: "landing.stats.label3" },
  { valueKey: "landing.stats.value4", labelKey: "landing.stats.label4" },
];
