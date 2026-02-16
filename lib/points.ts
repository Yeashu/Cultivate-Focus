import type { GrowthStageName } from "@/types";

export const POINT_MULTIPLIER = 1;

export const GROWTH_STAGES: { name: GrowthStageName; label: string; threshold: number }[] = [
  { name: "seed", label: "Seed", threshold: 0 },
  { name: "sprout", label: "Sprout", threshold: 60 },
  { name: "sapling", label: "Sapling", threshold: 150 },
  { name: "bloom", label: "Bloom", threshold: 300 },
];

export function calculateFocusPoints(minutes: number, multiplier = POINT_MULTIPLIER) {
  return Math.max(0, Math.round(minutes * multiplier));
}
