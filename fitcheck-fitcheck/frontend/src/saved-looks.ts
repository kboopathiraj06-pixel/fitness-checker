// Saved Looks — persist a user's favourite Fit Check reads on device via AsyncStorage.

import { storage } from "@/src/utils/storage";

import type { FaceProfile, Undertone } from "@/src/color-analysis";

const STORAGE_KEY = "fitcheck_saved_looks_v1";
const MAX_LOOKS = 25;

export type SavedLook = {
  id: string;
  createdAt: number;
  imageUri: string | null;
  imageBase64: string | null;
  profile: FaceProfile;
  manualTone: Undertone | null;
};

// Storage helper is typed for primitives — round-trip JSON ourselves.
async function readRaw(): Promise<string | null> {
  return storage.getItem<string | null>(STORAGE_KEY, null);
}

async function writeRaw(value: string): Promise<void> {
  await storage.setItem<string>(STORAGE_KEY, value);
}

export async function getSavedLooks(): Promise<SavedLook[]> {
  const raw = await readRaw();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as SavedLook[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function addSavedLook(look: Omit<SavedLook, "id" | "createdAt">): Promise<SavedLook> {
  const entry: SavedLook = {
    ...look,
    id: `look_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  };
  const current = await getSavedLooks();
  const next = [entry, ...current].slice(0, MAX_LOOKS);
  await writeRaw(JSON.stringify(next));
  return entry;
}

export async function removeSavedLook(id: string): Promise<SavedLook[]> {
  const current = await getSavedLooks();
  const next = current.filter((look) => look.id !== id);
  await writeRaw(JSON.stringify(next));
  return next;
}
