"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { GrowthStage } from "@/types";
import { PlantSVGs } from "./plant-svgs";

const PlantComponents = PlantSVGs;

interface PlantLifecycleProps {
  stage: GrowthStage;
  totalPoints: number;
}

export function PlantLifecycle({ stage, totalPoints }: PlantLifecycleProps) {
  const PlantComponent = PlantComponents[stage.name];
  
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--focus-soft)]/40 via-transparent to-[var(--accent)]/20 p-6">
      {/* Subtle animated background pattern based on stage */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <motion.div
          className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-[var(--focus)]/20 blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        {stage.name !== "seed" && (
          <motion.div
            className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[var(--focus)]/15 blur-2xl"
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.15, 0.25, 0.15],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          />
        )}
      </div>
      
      <div className="relative flex items-center gap-6">
        {/* Plant visualization */}
        <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-[var(--surface)]/80 shadow-sm backdrop-blur-sm">
          <AnimatePresence mode="wait">
            <motion.div
              key={stage.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="h-24 w-24"
            >
              <PlantComponent className="h-full w-full" />
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Info section */}
        <div className="flex-1">
          <p className="text-sm font-medium uppercase tracking-wide text-[var(--muted)]">
            Focus Growth
          </p>
          <motion.h2
            key={stage.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-semibold text-[var(--foreground)]"
          >
            {stage.label} Stage
          </motion.h2>
          <p className="mt-1 text-3xl font-semibold text-[var(--focus)]">
            {totalPoints} FP
          </p>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="relative mt-6">
        <div className="flex items-center justify-between text-xs uppercase tracking-wide text-[var(--muted)]">
          <span>{stage.threshold} FP</span>
          {stage.nextThreshold ? (
            <span>{stage.nextThreshold} FP</span>
          ) : (
            <span className="text-[var(--focus)]">✨ Blooming</span>
          )}
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--surface)]/60">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[var(--focus)] to-[var(--focus)]/80"
            initial={{ width: 0 }}
            animate={{ width: `${stage.progress * 100}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        {stage.nextThreshold && (
          <p className="mt-3 text-sm text-[var(--muted)]">
            {stage.nextThreshold - totalPoints} FP to reach{" "}
            <span className="font-medium text-[var(--focus)]">
              {stage.name === "seed" ? "Sprout" : stage.name === "sprout" ? "Sapling" : "Bloom"}
            </span>
          </p>
        )}
        {!stage.nextThreshold && (
          <p className="mt-3 text-sm text-[var(--focus)]">
            🌸 You have reached full bloom—keep nurturing your garden!
          </p>
        )}
      </div>
    </div>
  );
}
