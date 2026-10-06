'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ProgressRingProps {
  percentage: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  isOverBudget?: boolean;
}

export function ProgressRing({
  percentage,
  size = 180,
  strokeWidth = 14,
  label,
  sublabel,
  isOverBudget = false,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Clamped for visual stroke: if over budget, ring fills 100% in red
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);
  const strokeDashoffset = circumference - (clampedPercentage / 100) * circumference;

  let strokeColor = '#10B981'; // Emerald for healthy
  if (isOverBudget) {
    strokeColor = '#EF4444'; // Red for over budget
  } else if (percentage < 20) {
    strokeColor = '#EF4444'; // Low remaining is warning/danger
  } else if (percentage < 40) {
    strokeColor = '#F59E0B'; // Amber for watch
  } else {
    strokeColor = '#4F46E5'; // Indigo/emerald
  }

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-100 dark:text-gray-800"
          fill="transparent"
        />
        {/* Progress Fill */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
        <span
          className={`text-2xl font-bold tracking-tight ${
            isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
          }`}
        >
          {isOverBudget ? 'Exceeded' : `${Math.round(percentage)}%`}
        </span>
        {label && <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{label}</span>}
        {sublabel && <span className="text-[10px] text-gray-400 dark:text-gray-500">{sublabel}</span>}
      </div>
    </div>
  );
}
