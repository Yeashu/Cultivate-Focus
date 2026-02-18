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

const STORAGE_KEY = "cultivate-focus:onboarding-v2";

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
    id: "welcome",
    title: "Welcome to Cultivate Focus",
    description:
      "A calm space for mindful productivity. No sign-in required—just start focusing. Your data saves locally and syncs to the cloud when you're ready.",
    bulletPoints: [
      {
        label: "Action first, organize later",
        detail: "Jump straight into a focus session without planning. Every minute counts.",
      },
      {
        label: "Grow your digital garden",
        detail: "Earn 1 Focus Point per minute. Watch your plant evolve from Seed to Bloom.",
      },
      {
        label: "Optional account",
        detail: "Sign up anytime to sync across devices. Your guest data transfers automatically.",
      },
    ],
    icon: Sprout,
  },
  {
    id: "timer",
    title: "Start a focus session",
    description:
      "Head to the Timer to begin working. Pick a task or just start—quick sessions without a task are perfectly valid and still earn points.",
    bulletPoints: [
      {
        label: "1. Open Timer",
        detail: "Click Timer in the navigation bar.",
      },
      {
        label: "2. Link a task (optional)",
        detail: "Select a task to track progress, or leave it unlinked for a quick focus burst.",
      },
      {
        label: "3. Focus and earn",
        detail: "Press Start. When the mindful chime plays, your session logs automatically.",
      },
    ],
    action: { label: "Go to Timer", href: "/timer" },
    icon: TimerIcon,
  },
  {
    id: "planner",
    title: "Plan your week",
    description:
      "The Planner shows your week as a spread. Drag tasks between days, or drop them in 'Someday' for ideas without a deadline.",
    bulletPoints: [
      {
        label: "1. Open Planner",
        detail: "Click Planner in the navigation to see your weekly view.",
      },
      {
        label: "2. Add tasks",
        detail: "Type a task title. Set an optional focus goal in minutes.",
      },
      {
        label: "3. Drag to schedule",
        detail: "Move tasks between days or into the Someday horizon at the bottom.",
      },
    ],
    action: { label: "Go to Planner", href: "/" },
    icon: ClipboardList,
  },
  {
    id: "dashboard",
    title: "Track your growth",
    description:
      "The Dashboard shows today's stats, your weekly trend, and your plant's growth stage. Build streaks by focusing at least once each day.",
    bulletPoints: [
      {
        label: "Focus Points",
        detail: "See minutes, sessions, and points earned today.",
      },
      {
        label: "Plant lifecycle",
        detail: "Seed (0) → Sprout (60) → Sapling (150) → Bloom (300 points).",
      },
      {
        label: "Garden streak",
        detail: "Consecutive days with at least one session. Keep the leaves growing!",
      },
    ],
    action: { label: "Go to Dashboard", href: "/dashboard" },
    icon: BarChart3,
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
