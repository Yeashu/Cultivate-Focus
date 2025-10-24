"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  ClipboardList,
  Play,
  Sparkles,
  Sprout,
  Timer as TimerIcon,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const STORAGE_KEY = "cultivate-focus:onboarding-v1";

type TutorialStep = {
  id: string;
  title: string;
  description: string;
  bulletPoints: Array<{ label: string; detail: string }>;
  action?: { label: string; href: string };
  icon: LucideIcon;
};

const tutorialSteps: TutorialStep[] = [
  {
    id: "tasks",
    title: "Capture today’s tasks",
    description:
      "Open the Tasks tab to list what you want to focus on. Each task keeps a time goal and collects Focus Points when you finish sessions.",
    bulletPoints: [
      {
        label: "1. Click the Tasks tab",
        detail: "Use the top navigation to switch to Tasks whenever you need to edit your list.",
      },
      {
        label: "2. Add a task",
        detail: "Fill out the form with a title, optional notes, and your planned focus minutes.",
      },
      {
        label: "3. Watch progress",
        detail: "Focus Points add up automatically for each task every time you log a session.",
      },
    ],
    action: { label: "Go to Tasks", href: "/tasks" },
    icon: ClipboardList,
  },
  {
    id: "timer",
    title: "Run a focus session",
    description:
      "Head to the Timer tab to start working. The timer guides you through focus and break blocks while tracking the task you’ve selected.",
    bulletPoints: [
      {
        label: "1. Click Timer",
        detail: "Switch to the Timer tab from the navigation bar.",
      },
      {
        label: "2. Choose your task",
        detail: "Use the task selector so Focus Points go to the right item.",
      },
      {
        label: "3. Start and log",
        detail: "Press Start, stay with the timer, and let the session auto-log when the chime plays.",
      },
    ],
    action: { label: "Go to Timer", href: "/timer" },
    icon: TimerIcon,
  },
  {
    id: "dashboard",
    title: "Review your dashboard",
    description:
      "The Dashboard tab shows today’s totals, your recent streak, and charts for the past week so you can adjust quickly.",
    bulletPoints: [
      {
        label: "1. Open Dashboard",
        detail: "Use the Dashboard button in the header to return here any time.",
      },
      {
        label: "2. Check your stats",
        detail: "See minutes, sessions, and Focus Points for today on the summary cards.",
      },
      {
        label: "3. Look at recent activity",
        detail: "The weekly chart and highlights show which tasks are earning the most points.",
      },
    ],
    action: { label: "Go to Dashboard", href: "/" },
    icon: BarChart3,
  },
  {
    id: "ritual",
    title: "Keep a simple routine",
    description:
      "Repeat this loop each day: capture tasks, run sessions with the timer, then review the dashboard. Consistency is what builds Focus Points over time.",
    bulletPoints: [
      {
        label: "Morning: plan",
        detail: "Add or update tasks so you know what you will work on.",
      },
      {
        label: "During work: focus",
        detail: "Run a focus session whenever you start a block of deep work.",
      },
      {
        label: "End of day: review",
        detail: "Peek at the dashboard to see what earned the most points and plan the next day.",
      },
    ],
    icon: Sprout,
  },
];

export function OnboardingGuide() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const hasCompleted = window.localStorage.getItem(STORAGE_KEY);
    if (hasCompleted) {
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      setIsOpen(true);
    });
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (typeof document === "undefined") {
      return;
    }
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const currentStep = tutorialSteps[stepIndex];
  const stepsCount = tutorialSteps.length;
  const progressPercent = ((stepIndex + 1) / stepsCount) * 100;

  const handleClose = (markComplete: boolean) => {
    if (markComplete && typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "1");
    }
    setIsOpen(false);
    setStepIndex(0);
  };

  const handleNext = () => {
    setStepIndex((prev) => Math.min(prev + 1, stepsCount - 1));
  };

  const handleBack = () => {
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleAction = (href: string | undefined) => {
    if (!href) {
      return;
    }
    handleClose(true);
    window.requestAnimationFrame(() => {
      router.push(href);
    });
  };

  const progressDots = useMemo(
    () =>
      tutorialSteps.map((step, index) => (
        <button
          key={step.id}
          type="button"
          aria-label={`Go to step ${index + 1}`}
          className={`h-2 w-8 rounded-full transition-all ${
            index === stepIndex
              ? "bg-[var(--focus)]"
              : "bg-[var(--surface-muted)]/80 hover:bg-[var(--surface-muted)]"
          }`}
          onClick={() => setStepIndex(index)}
        />
      )),
    [stepIndex]
  );

  const Icon = currentStep.icon;

  return (
    <>
      <button
        type="button"
        className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--foreground)] shadow-sm transition-all hover:border-[var(--focus)] hover:text-[var(--focus)]"
        onClick={() => setIsOpen(true)}
      >
        <Sparkles className="h-4 w-4" />
        Guide
      </button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              key={currentStep.id}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 180, damping: 20 }}
              className="relative flex w-[min(680px,92vw)] flex-col gap-6 rounded-4xl border border-[var(--border)] bg-[var(--surface)]/95 p-8 text-[var(--foreground)] shadow-2xl"
            >
              <button
                type="button"
                aria-label="Close tutorial"
                className="absolute right-4 top-4 text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
                onClick={() => handleClose(true)}
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--focus-soft)] text-[var(--focus)]">
                  <Icon className="h-8 w-8" />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                    Step {stepIndex + 1} of {stepsCount}
                  </span>
                  <h2 className="text-2xl font-semibold leading-snug">{currentStep.title}</h2>
                  <p className="text-sm leading-relaxed text-[var(--muted)]">
                    {currentStep.description}
                  </p>
                </div>
              </div>

              <ul className="space-y-3 rounded-3xl bg-[var(--surface-muted)]/40 p-5">
                {currentStep.bulletPoints.map((point) => (
                  <li key={point.label} className="flex gap-3">
                    <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--focus)] shadow">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)]">
                        {point.label}
                      </p>
                      <p className="text-sm text-[var(--muted)]">{point.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-44 rounded-full bg-[var(--surface-muted)]/70">
                    <div
                      className="h-full rounded-full bg-[var(--focus)]"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex gap-2">{progressDots}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted)] transition-colors hover:border-[var(--muted)] hover:text-[var(--foreground)]"
                    onClick={() => handleClose(true)}
                  >
                    Skip tutorial
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--foreground)]"
                      onClick={handleBack}
                      disabled={stepIndex === 0}
                    >
                      <ArrowLeft className="h-4 w-4" /> Back
                    </button>
                    {stepIndex === stepsCount - 1 ? (
                      <button
                        type="button"
                        className="flex items-center gap-2 rounded-full bg-[var(--focus)] px-4 py-2 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-[var(--focus)]/90"
                        onClick={() => handleClose(true)}
                      >
                        <Play className="h-4 w-4" /> Begin mindful work
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="flex items-center gap-2 rounded-full bg-[var(--focus)] px-4 py-2 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-[var(--focus)]/90"
                        onClick={handleNext}
                      >
                        Next <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {currentStep.action ? (
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-3xl bg-gradient-to-r from-[var(--focus-soft)]/90 via-[var(--accent)]/20 to-transparent px-6 py-4 text-left text-sm text-[var(--foreground)] shadow-inner transition-transform hover:scale-[1.01]"
                  onClick={() => handleAction(currentStep.action?.href)}
                >
                  <div>
                    <p className="font-semibold">{currentStep.action.label}</p>
                    <p className="text-xs text-[var(--muted)]">
                      Jump straight to this space and try it out.
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : null}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
