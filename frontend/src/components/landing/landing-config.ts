/**
 * Content config for the landing page. Edit copy / images here without
 * touching components.
 *
 * NOTE on images: we use Unsplash as a stand-in. Replace with your own
 * branded photography by swapping the `src` strings — the components stay
 * the same.
 */

export type RoleSectionContent = {
  /** stable key for React lists */
  key: string;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  /** primary inline CTA */
  cta: { label: string; href: string };
  /** lazy-loaded image */
  image: { src: string; alt: string };
};

const UNSPLASH = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?w=${w}&auto=format&fit=crop&q=75`;

/** Hero image — eager-loaded above the fold. */
export const HERO_IMAGE = {
  src: UNSPLASH("photo-1521737711867-e3b97375f902", 1600),
  alt: "Two professionals collaborating on hiring decisions",
};

/** Logo strip — text-only placeholders. Replace with real partner logos. */
export const TRUSTED_BY = [
  "Mercurial Labs",
  "ETH Zürich",
  "OpenZeppelin",
  "Polygon",
  "Secureum",
  "MIT Bootcamps",
];

/** Three role sections — alternates image/text orientation. */
export const ROLE_SECTIONS: RoleSectionContent[] = [
  {
    key: "candidates",
    eyebrow: "For Candidates",
    title: "Own your verified credentials. Stand out where it matters.",
    description:
      "Carry every degree, certificate and on-the-job achievement in one wallet. Issuers anchor them on-chain — recruiters trust them on sight, no follow-ups needed.",
    bullets: [
      "Receive credentials directly from your school or employer",
      "Share a single link that proves authenticity instantly",
      "Get matched to roles that fit your real, verified skills",
    ],
    cta: { label: "Start your wallet", href: "/register" },
    image: {
      src: UNSPLASH("photo-1517245386807-bb43f82c33c4", 1200),
      alt: "Candidate reviewing their verified credentials on a laptop",
    },
  },
  {
    key: "recruiters",
    eyebrow: "For Recruiters",
    title: "Hire on what's been verified, not just claimed.",
    description:
      "Stop chasing PDFs and back-channel references. TrustLink ranks candidates by verified skills using AI, and shows you the on-chain proof for every credential before you reach out.",
    bullets: [
      "AI ranks 184 candidates against your role in 2.3 seconds",
      "Every credential links to its on-chain transaction",
      "Send offers backed by verifiable evidence — not just resumes",
    ],
    cta: { label: "Post a verified job", href: "/register" },
    image: {
      src: UNSPLASH("photo-1556761175-5973dc0f32e7", 1200),
      alt: "Recruiting team reviewing ranked candidate matches",
    },
  },
  {
    key: "issuers",
    eyebrow: "For Institutions",
    title: "Issue credentials your graduates can actually use.",
    description:
      "Move beyond paper certificates and PDFs that get lost in inboxes. Sign and publish credentials on-chain in a few clicks — your alumni get tamper-proof records, you get audit-ready provenance.",
    bullets: [
      "Batch-issue thousands of credentials from a single Excel upload",
      "Revoke or reissue with a clear audit trail",
      "Joining an open registry trusted by 184+ partners",
    ],
    cta: { label: "Become an issuer", href: "/register" },
    image: {
      src: UNSPLASH("photo-1523050854058-8df90110c9f1", 1200),
      alt: "University graduates receiving their credentials",
    },
  },
];

/** "How it works" — 3 steps. */
export const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Issuer signs the credential",
    description:
      "Your school, employer or training body publishes the credential on Polygon with a one-click signature.",
  },
  {
    step: "02",
    title: "Candidate owns it forever",
    description:
      "It lands in the candidate's wallet — not a third-party database. They control where it goes.",
  },
  {
    step: "03",
    title: "Recruiter verifies in a click",
    description:
      "Recruiters see the on-chain proof inline while AI matches the candidate to the right roles.",
  },
];

/** Stats — big bold numbers. */
export const STATS = [
  { value: "2.4M", label: "Credentials anchored on-chain" },
  { value: "184", label: "Partner institutions and employers" },
  { value: "97%", label: "Match accuracy from verified skills" },
  { value: "2.3s", label: "Average AI re-rank time" },
];
