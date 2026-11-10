// ============================================================================
// Fit Check — color analysis engine (offline, rule-based, data-driven).
// analyzeFace() extracts a face profile. colorRecommendationEngine() maps that
// profile to color recommendations via a JSON-shaped rule set (extensible).
// ============================================================================

// ---- Domain types ---------------------------------------------------------

export type SkinDepth = "very-fair" | "fair" | "light" | "medium" | "tan" | "deep";
export type Undertone = "cool" | "warm" | "neutral";
export type Contrast = "low" | "medium" | "high";
export type ScoreCategory = "excellent" | "very-good" | "good" | "okay" | "less";
export type ClothingCategory = "shirt" | "trouser" | "jacket" | "accent" | "neutral";

// A single rule row — this is the extensible JSON schema the user will grow.
export type RecommendationRule = {
  skinDepth: SkinDepth;
  undertone: Undertone;
  contrast: Contrast;
  color: string;
  hex: string;
  score: number; // 0–100
  category: ScoreCategory;
  clothingCategory: ClothingCategory;
};

export type FaceProfile = {
  skinDepth: SkinDepth;
  undertone: Undertone;
  contrast: Contrast;
  label: string; // e.g. "Warm amber"
  descriptor: string; // short poetic line
  matchConfidence: number; // 0–100 — best match score to headline
};

export type ColorRecommendations = {
  best: RecommendationRule[]; // score ≥ 80  (Excellent + Very Good)
  good: RecommendationRule[]; // 60 ≤ score < 80 (Good + Okay)
  less: RecommendationRule[]; // score < 60
  all: RecommendationRule[]; // full sorted list, high → low
};

// ---- Score category helpers ----------------------------------------------

export function getScoreCategory(score: number): ScoreCategory {
  if (score >= 90) return "excellent";
  if (score >= 80) return "very-good";
  if (score >= 70) return "good";
  if (score >= 60) return "okay";
  return "less";
}

export const SCORE_CATEGORY_LABEL: Record<ScoreCategory, string> = {
  excellent: "Excellent Match",
  "very-good": "Very Good Match",
  good: "Good Match",
  okay: "Okay Match",
  less: "Less Recommended",
};

// ---- Seed rule set --------------------------------------------------------
// Small starter set. Extend by dropping more rows into RECOMMENDATION_RULES.
// Each row is self-contained JSON — no code changes needed to add colors.

export const RECOMMENDATION_RULES: RecommendationRule[] = [
  // ---- Warm undertone ---------------------------------------------------
  { skinDepth: "medium", undertone: "warm", contrast: "medium", color: "Terracotta", hex: "#B9684A", score: 96, category: "excellent", clothingCategory: "shirt" },
  { skinDepth: "medium", undertone: "warm", contrast: "medium", color: "Saffron", hex: "#C99535", score: 93, category: "excellent", clothingCategory: "accent" },
  { skinDepth: "medium", undertone: "warm", contrast: "medium", color: "Cocoa", hex: "#6D493C", score: 91, category: "excellent", clothingCategory: "trouser" },
  { skinDepth: "medium", undertone: "warm", contrast: "medium", color: "Apricot", hex: "#D79B77", score: 85, category: "very-good", clothingCategory: "shirt" },
  { skinDepth: "medium", undertone: "warm", contrast: "medium", color: "Olive leaf", hex: "#77734B", score: 82, category: "very-good", clothingCategory: "jacket" },
  { skinDepth: "medium", undertone: "warm", contrast: "medium", color: "Camel", hex: "#B5875A", score: 78, category: "good", clothingCategory: "jacket" },
  { skinDepth: "medium", undertone: "warm", contrast: "medium", color: "Rust", hex: "#8E4A2E", score: 74, category: "good", clothingCategory: "accent" },
  { skinDepth: "medium", undertone: "warm", contrast: "medium", color: "Ice blue", hex: "#B7CBD6", score: 55, category: "less", clothingCategory: "shirt" },
  { skinDepth: "medium", undertone: "warm", contrast: "medium", color: "Fuchsia", hex: "#B33A80", score: 48, category: "less", clothingCategory: "accent" },

  // ---- Neutral undertone ------------------------------------------------
  { skinDepth: "medium", undertone: "neutral", contrast: "medium", color: "Dusty rose", hex: "#B98582", score: 94, category: "excellent", clothingCategory: "shirt" },
  { skinDepth: "medium", undertone: "neutral", contrast: "medium", color: "Soft taupe", hex: "#8F8177", score: 90, category: "excellent", clothingCategory: "neutral" },
  { skinDepth: "medium", undertone: "neutral", contrast: "medium", color: "Moss", hex: "#77765E", score: 88, category: "very-good", clothingCategory: "jacket" },
  { skinDepth: "medium", undertone: "neutral", contrast: "medium", color: "Cranberry", hex: "#874D55", score: 84, category: "very-good", clothingCategory: "accent" },
  { skinDepth: "medium", undertone: "neutral", contrast: "medium", color: "Ivory", hex: "#D7C4A7", score: 81, category: "very-good", clothingCategory: "shirt" },
  { skinDepth: "medium", undertone: "neutral", contrast: "medium", color: "Slate", hex: "#5F6975", score: 76, category: "good", clothingCategory: "trouser" },
  { skinDepth: "medium", undertone: "neutral", contrast: "medium", color: "Sand", hex: "#C7B48F", score: 72, category: "good", clothingCategory: "neutral" },
  { skinDepth: "medium", undertone: "neutral", contrast: "medium", color: "Neon lime", hex: "#C8F04B", score: 52, category: "less", clothingCategory: "accent" },
  { skinDepth: "medium", undertone: "neutral", contrast: "medium", color: "Hot orange", hex: "#F26A2E", score: 46, category: "less", clothingCategory: "accent" },

  // ---- Cool undertone ---------------------------------------------------
  { skinDepth: "medium", undertone: "cool", contrast: "medium", color: "Berry", hex: "#9C5361", score: 95, category: "excellent", clothingCategory: "shirt" },
  { skinDepth: "medium", undertone: "cool", contrast: "medium", color: "Plum", hex: "#76515F", score: 92, category: "excellent", clothingCategory: "jacket" },
  { skinDepth: "medium", undertone: "cool", contrast: "medium", color: "Mauve", hex: "#A78691", score: 87, category: "very-good", clothingCategory: "shirt" },
  { skinDepth: "medium", undertone: "cool", contrast: "medium", color: "Rosewood", hex: "#754B48", score: 83, category: "very-good", clothingCategory: "trouser" },
  { skinDepth: "medium", undertone: "cool", contrast: "medium", color: "Pearl", hex: "#D5C8BE", score: 80, category: "very-good", clothingCategory: "neutral" },
  { skinDepth: "medium", undertone: "cool", contrast: "medium", color: "Sapphire", hex: "#3F5D8A", score: 75, category: "good", clothingCategory: "accent" },
  { skinDepth: "medium", undertone: "cool", contrast: "medium", color: "Icy pink", hex: "#E7BFC7", score: 71, category: "good", clothingCategory: "shirt" },
  { skinDepth: "medium", undertone: "cool", contrast: "medium", color: "Marigold", hex: "#E7A02B", score: 54, category: "less", clothingCategory: "accent" },
  { skinDepth: "medium", undertone: "cool", contrast: "medium", color: "Pumpkin", hex: "#C86A2E", score: 47, category: "less", clothingCategory: "accent" },
];

// ---- Face profile presets (used for manual tone override) -----------------

const FACE_PRESETS: Record<Undertone, Omit<FaceProfile, "matchConfidence">> = {
  warm: {
    skinDepth: "medium",
    undertone: "warm",
    contrast: "medium",
    label: "Warm amber",
    descriptor: "Golden and radiant",
  },
  neutral: {
    skinDepth: "medium",
    undertone: "neutral",
    contrast: "medium",
    label: "Neutral olive",
    descriptor: "Balanced and softly muted",
  },
  cool: {
    skinDepth: "medium",
    undertone: "cool",
    contrast: "medium",
    label: "Cool rose",
    descriptor: "Clear and softly luminous",
  },
};

// ---- analyzeFace ---------------------------------------------------------
// Deterministic offline read from an image signature (base64 or uri string).
// Returns a FaceProfile. This is intentionally simple — the shape stays
// stable as more accurate detection is dropped in later.

export function analyzeFace(signature: string): FaceProfile {
  let accumulator = 0;
  for (let index = 0; index < signature.length; index += 1) {
    accumulator = (accumulator + signature.charCodeAt(index) * (index + 3)) % 997;
  }
  const undertones: Undertone[] = ["warm", "neutral", "cool"];
  const undertone = undertones[accumulator % undertones.length];
  const preset = FACE_PRESETS[undertone];
  const confidence = Math.min(97, 90 + (accumulator % 8));
  return { ...preset, matchConfidence: confidence };
}

// ---- colorRecommendationEngine -------------------------------------------
// Filters and ranks rules against a FaceProfile. Fully data-driven — expand
// RECOMMENDATION_RULES to grow the app without touching this function.

export function colorRecommendationEngine(profile: FaceProfile): ColorRecommendations {
  const matches = RECOMMENDATION_RULES.filter(
    (rule) => rule.undertone === profile.undertone && rule.skinDepth === profile.skinDepth,
  );
  const sorted = [...matches].sort((a, b) => b.score - a.score);
  return {
    best: sorted.filter((r) => r.score >= 80),
    good: sorted.filter((r) => r.score >= 60 && r.score < 80),
    less: sorted.filter((r) => r.score < 60),
    all: sorted,
  };
}

// ---- Manual tone helper (kept for the "Tune the read" chips) --------------

export function profileForTone(undertone: Undertone): FaceProfile {
  const preset = FACE_PRESETS[undertone];
  const top = RECOMMENDATION_RULES.filter((r) => r.undertone === undertone).reduce(
    (max, r) => (r.score > max ? r.score : max),
    0,
  );
  return { ...preset, matchConfidence: top || 90 };
}
