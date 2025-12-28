"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { GrowthStage } from "@/types";

// SVG Plant illustrations for each growth stage
function SeedSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none">
      {/* Soil mound */}
      <ellipse cx="50" cy="85" rx="35" ry="10" fill="var(--focus)" opacity="0.2" />
      {/* Seed */}
      <motion.ellipse
        cx="50"
        cy="75"
        rx="8"
        ry="12"
        fill="var(--focus)"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
      {/* Tiny crack showing life */}
      <motion.path
        d="M50 68 Q52 72 50 76"
        stroke="var(--focus-soft)"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      />
    </svg>
  );
}

function SproutSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none">
      {/* Soil */}
      <ellipse cx="50" cy="88" rx="30" ry="8" fill="var(--focus)" opacity="0.2" />
      {/* Stem */}
      <motion.path
        d="M50 85 Q50 65 50 55"
        stroke="var(--focus)"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
      {/* Left leaf */}
      <motion.path
        d="M50 60 Q35 55 38 45 Q45 50 50 60"
        fill="var(--focus)"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4, ease: "backOut" }}
      />
      {/* Right leaf */}
      <motion.path
        d="M50 55 Q65 50 62 40 Q55 45 50 55"
        fill="var(--focus)"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5, ease: "backOut" }}
      />
    </svg>
  );
}

function SaplingSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none">
      {/* Soil */}
      <ellipse cx="50" cy="92" rx="28" ry="6" fill="var(--focus)" opacity="0.2" />
      {/* Main stem */}
      <motion.path
        d="M50 90 Q50 60 50 35"
        stroke="var(--focus)"
        strokeWidth="4"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5 }}
      />
      {/* Branch left */}
      <motion.path
        d="M50 70 Q35 65 30 55"
        stroke="var(--focus)"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      />
      {/* Branch right */}
      <motion.path
        d="M50 55 Q65 50 70 40"
        stroke="var(--focus)"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      />
      {/* Leaves */}
      <motion.ellipse
        cx="28"
        cy="50"
        rx="10"
        ry="6"
        fill="var(--focus)"
        transform="rotate(-30 28 50)"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.5, ease: "backOut" }}
      />
      <motion.ellipse
        cx="72"
        cy="36"
        rx="10"
        ry="6"
        fill="var(--focus)"
        transform="rotate(30 72 36)"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.6, ease: "backOut" }}
      />
      <motion.ellipse
        cx="50"
        cy="30"
        rx="12"
        ry="8"
        fill="var(--focus)"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.7, ease: "backOut" }}
      />
    </svg>
  );
}

function BloomSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none">
      {/* Soil */}
      <ellipse cx="50" cy="95" rx="25" ry="4" fill="var(--focus)" opacity="0.2" />
      {/* Main stem */}
      <motion.path
        d="M50 93 Q50 55 50 25"
        stroke="var(--focus)"
        strokeWidth="4"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4 }}
      />
      {/* Branches */}
      <motion.path
        d="M50 75 Q30 70 25 58"
        stroke="var(--focus)"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.2, delay: 0.2 }}
      />
      <motion.path
        d="M50 60 Q70 55 75 45"
        stroke="var(--focus)"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.2, delay: 0.3 }}
      />
      {/* Flower petals (main bloom) */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <motion.ellipse
          key={angle}
          cx={50 + Math.cos((angle * Math.PI) / 180) * 12}
          cy={20 + Math.sin((angle * Math.PI) / 180) * 12}
          rx="8"
          ry="5"
          fill="var(--focus)"
          opacity="0.8"
          transform={`rotate(${angle} ${50 + Math.cos((angle * Math.PI) / 180) * 12} ${20 + Math.sin((angle * Math.PI) / 180) * 12})`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.8 }}
          transition={{ duration: 0.3, delay: 0.4 + i * 0.05, ease: "backOut" }}
        />
      ))}
      {/* Flower center */}
      <motion.circle
        cx="50"
        cy="20"
        r="6"
        fill="var(--break)"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.7, ease: "backOut" }}
      />
      {/* Side leaves */}
      <motion.ellipse
        cx="22"
        cy="55"
        rx="10"
        ry="5"
        fill="var(--focus)"
        transform="rotate(-40 22 55)"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2, delay: 0.5 }}
      />
      <motion.ellipse
        cx="78"
        cy="42"
        rx="10"
        ry="5"
        fill="var(--focus)"
        transform="rotate(40 78 42)"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2, delay: 0.6 }}
      />
    </svg>
  );
}

const PlantComponents = {
  seed: SeedSVG,
  sprout: SproutSVG,
  sapling: SaplingSVG,
  bloom: BloomSVG,
};

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
