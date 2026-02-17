import type { GrowthStageName, GrowthStage } from "@/types";

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

export function calculateGrowthStage(totalPoints: number): GrowthStage {
  let stageIndex = 0;
  for (let i = GROWTH_STAGES.length - 1; i >= 0; i--) {
    if (totalPoints >= GROWTH_STAGES[i].threshold) {
      stageIndex = i;
      break;
    }
  }

  const current = GROWTH_STAGES[stageIndex];
  const next = GROWTH_STAGES[stageIndex + 1] ?? null;

  let progress = 1;
  if (next) {
    const range = next.threshold - current.threshold;
    const earned = totalPoints - current.threshold;
    progress = Math.min(1, earned / range);
  }

  return {
    name: current.name,
    label: current.label,
    threshold: current.threshold,
    nextThreshold: next?.threshold ?? null,
    progress,
  };
}
