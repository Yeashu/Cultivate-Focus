import { Leaf, Sprout, Flower2, Trees } from "lucide-react";
import { GROWTH_STAGES } from "@/lib/points";
import type { LucideIcon } from "lucide-react";

const STAGE_ICONS: Record<string, LucideIcon> = {
  seed: Sprout,
  sprout: Leaf,
  sapling: Flower2,
  bloom: Trees,
};

export function PlantGrowth({ points }: { points: number }) {
  const currentStageIndex = Math.max(
    GROWTH_STAGES.findIndex((stage, index) => {
      const nextThreshold = GROWTH_STAGES[index + 1]?.threshold ?? Infinity;
      return points >= stage.threshold && points < nextThreshold;
    }),
    0
  );

  const currentStage = GROWTH_STAGES[currentStageIndex];
  const nextStage = GROWTH_STAGES[currentStageIndex + 1];
  const progressWithinStage = (() => {
    if (!nextStage) {
      return 1;
    }
    const range = nextStage.threshold - currentStage.threshold;
    const progress = points - currentStage.threshold;
    return Math.min(1, progress / range);
  })();

  const Icon = STAGE_ICONS[currentStage.name] ?? Sprout;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[var(--border)]/60 bg-gradient-to-br from-[var(--focus-soft)]/70 to-[var(--accent)]/20 p-6 text-[var(--foreground)] shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface)] text-[var(--focus)] shadow">
            <Icon className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-[var(--muted)]">
              Focus Growth
            </p>
            <h2 className="text-2xl font-semibold">
              {currentStage.label} stage
            </h2>
          </div>
        </div>
        <p className="text-3xl font-semibold">{points} FP</p>
      </div>
      <div className="mt-6">
        <div className="flex items-center justify-between text-xs uppercase tracking-wide text-[var(--muted)]">
          <span>{currentStage.threshold} FP</span>
          {nextStage ? <span>{nextStage.threshold} FP</span> : <span>Blooming</span>}
        </div>
        <div className="mt-2 h-2 rounded-full bg-[var(--surface)]/60">
          <div
            className="h-full rounded-full bg-[var(--focus)] transition-all"
            style={{ width: `${progressWithinStage * 100}%` }}
          />
        </div>
        <p className="mt-3 text-sm text-[var(--muted)]">
          {nextStage
            ? `${Math.max(nextStage.threshold - points, 0)} Focus Points to reach ${nextStage.label}`
            : "You have reached the bloom stage—keep sustaining the habit!"}
        </p>
      </div>
    </div>
  );
}
