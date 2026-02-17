"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const PlannerView = dynamic(
  () =>
    import("@/components/planner/planner-view").then((mod) => mod.PlannerView),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between px-4 py-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="flex flex-1">
          <div className="grid flex-1 grid-cols-7 gap-0">
            {[...Array(7)].map((_, idx) => (
              <div
                key={idx}
                className="space-y-3 border-r border-[var(--border)]/30 p-3 last:border-r-0"
              >
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-8 w-8" />
                {[...Array(3)].map((__, jdx) => (
                  <Skeleton key={jdx} className="h-6 w-full rounded" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  }
);

export default function PlannerPage() {
  return <PlannerView />;
}
