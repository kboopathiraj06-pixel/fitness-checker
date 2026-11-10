# Fit Check — PRD

## What
A quiet, offline color analysis app. The user picks a portrait (gallery or camera) and gets a face profile plus a data-driven list of clothing colors sorted by how well they match. No network, no photo uploads.

## Core flow
1. Pick photo (Gallery / Camera) or tap a manual tone (Warm / Neutral / Cool).
2. `analyzeFace()` derives a `FaceProfile` (skin depth, undertone, contrast, label, match confidence).
3. `colorRecommendationEngine(profile)` filters and ranks rules from `RECOMMENDATION_RULES`.
4. UI shows headline % + category badge, then Best / Good / Less Recommended sections.

## Architecture (offline, data-driven)
- `/app/frontend/src/color-analysis.ts`
  - Types: `SkinDepth`, `Undertone`, `Contrast`, `ScoreCategory`, `ClothingCategory`, `RecommendationRule`, `FaceProfile`, `ColorRecommendations`.
  - `analyzeFace(signature: string) → FaceProfile` — deterministic offline read from image signature.
  - `colorRecommendationEngine(profile) → { best, good, less, all }` — filters + sorts rules.
  - `getScoreCategory(score) → ScoreCategory` and `SCORE_CATEGORY_LABEL`.
  - `RECOMMENDATION_RULES: RecommendationRule[]` — seed rule set. **Extend this array to grow the app; no code changes needed.**
- `/app/frontend/app/index.tsx` — UI. Consumes the engine only through the exported functions and types.

## Score categories
| Score | Category | Label |
| --- | --- | --- |
| 90–100 | excellent | Excellent Match |
| 80–89 | very-good | Very Good Match |
| 70–79 | good | Good Match |
| 60–69 | okay | Okay Match |
| < 60 | less | Less Recommended |

UI bucketing: Best (≥80), Good (60–79), Less recommended (<60).

## RecommendationRule schema
```ts
{
  skinDepth: "very-fair" | "fair" | "light" | "medium" | "tan" | "deep",
  undertone: "cool" | "warm" | "neutral",
  contrast:  "low" | "medium" | "high",
  color: string,          // display name
  hex: string,            // swatch color
  score: number,          // 0–100
  category: ScoreCategory,
  clothingCategory: "shirt" | "trouser" | "jacket" | "accent" | "neutral"
}
```

## UI highlights
- Header title renamed to **Fit Check**.
- Preview shows a subtle **% match** chip overlay once a read is available.
- Result card: big **% on top**, small **category badge below**.
- Three color sections with per-section counts, ready to scale to 50+ rows.
- Manual tone chips (Warm / Neutral / Cool) tune the read without a photo.
- Removed the "Rule-based and offline by design" footer per request.

## Offline & privacy
- Entirely on-device: no backend calls, no image uploads.
- No auth. No stored user data.

## Save & Share
- **Save look** — persists the current read (photo + profile + manual tone) to AsyncStorage under `fitcheck_saved_looks_v1`. Up to 25 kept, newest first.
- **Saved pill** in the header shows the count and opens a modal listing every saved look with thumbnail, date, % and category badge; tap to reload, trash icon to delete.
- **Share look** — captures the result card via `react-native-view-shot` and hands it to `expo-sharing`. On web preview this shows a toast ("Sharing works on your phone build") since `expo-sharing` is native-only.

## Not built yet (deferred)
- AdMob monetisation — pending user's App ID + Ad unit IDs.
- Full color-rule database — the current 27-rule seed is scaffolding; the user will drop in the real ruleset.
- Contrast + skin-depth branches in `analyzeFace` — schema is ready; only the "medium × *" slice is populated.
