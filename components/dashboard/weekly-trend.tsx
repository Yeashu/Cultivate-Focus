"use client";

import { motion } from "framer-motion";
import { formatDateLabel } from "@/lib/dates";
import type { FocusStats } from "@/types";

interface WeeklyTrendProps {
  data: FocusStats["weekly"];
}

export function WeeklyTrend({ data }: WeeklyTrendProps) {
  const maxPoints = Math.max(...data.map((entry) => entry.points), 1);
  const minPoints = 0;
  
  // Chart dimensions
  const width = 100;
  const height = 60;
  const padding = { top: 10, right: 5, bottom: 5, left: 5 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // Calculate points for the line
  const points = data.map((entry, index) => {
    const x = padding.left + (index / (data.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - ((entry.points - minPoints) / (maxPoints - minPoints)) * chartHeight;
    return { x, y, ...entry };
  });
  
  // Create SVG path
  const linePath = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");
  
  // Create area path (for gradient fill)
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;
  
  const totalWeekPoints = data.reduce((sum, d) => sum + d.points, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-[var(--muted)]">
            This Week
          </p>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Focus Trend
          </h2>
        </div>
        <motion.span
          key={totalWeekPoints}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-2xl font-semibold text-[var(--focus)]"
        >
          {totalWeekPoints} FP
        </motion.span>
      </div>
      
      {/* Line Chart */}
      <div className="relative h-32">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-full w-full"
          preserveAspectRatio="none"
        >
          {/* Gradient definition */}
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--focus)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--focus)" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          
          {/* Subtle grid lines */}
          {[0.25, 0.5, 0.75].map((ratio) => (
            <line
              key={ratio}
              x1={padding.left}
              y1={padding.top + chartHeight * ratio}
              x2={padding.left + chartWidth}
              y2={padding.top + chartHeight * ratio}
              stroke="var(--border)"
              strokeOpacity="0.3"
              strokeDasharray="2 4"
            />
          ))}
          
          {/* Area fill */}
          <motion.path
            d={areaPath}
            fill="url(#areaGradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          />
          
          {/* Line */}
          <motion.path
            d={linePath}
            fill="none"
            stroke="var(--focus)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          
          {/* Data points */}
          {points.map((point, index) => (
            <motion.circle
              key={point.date}
              cx={point.x}
              cy={point.y}
              r="3"
              fill="var(--surface)"
              stroke="var(--focus)"
              strokeWidth="2"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.6 + index * 0.05 }}
            />
          ))}
        </svg>
      </div>
      
      {/* Day labels */}
      <div className="flex justify-between px-1">
        {data.map((entry) => (
          <div key={entry.date} className="flex flex-col items-center gap-1">
            <span className="text-xs font-medium text-[var(--muted)]">
              {formatDateLabel(entry.date)}
            </span>
            {entry.points > 0 && (
              <motion.span
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="text-xs font-semibold text-[var(--focus)]"
              >
                {entry.points}
              </motion.span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
