"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const WeeklyPlanner = dynamic(
  () => import("@/components/planner/weekly-planner").then((mod) => mod.WeeklyPlanner),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="grid gap-6 md:grid-cols-7">
          {[...Array(7)].map((_, idx) => (
            <div key={idx} className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
              <Skeleton className="h-4 w-24" />
              {[...Array(3)].map((__, jdx) => (
                <Skeleton key={jdx} className="h-10 w-full rounded-xl" />
              ))}
            </div>
          ))}
        </div>
      </div>
    ),
  }
);

export default function TasksPage() {
  return <WeeklyPlanner />;
}
