import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import { YearTarget } from "@/types"

export function formatYearTarget(yearTarget?: YearTarget[] | YearTarget) {
  if (!yearTarget) return 'ALL TARGETS';
  const targets = Array.isArray(yearTarget) ? yearTarget : [yearTarget];
  if (targets.includes('ALL')) return 'ALL TARGETS';
  const map: Record<string, string> = {
    FIRST: 'Y1',
    SECOND: 'Y2',
    THIRD: 'Y3',
    FOURTH: 'Y4'
  };
  const order = ['FIRST', 'SECOND', 'THIRD', 'FOURTH'];
  const sorted = [...targets].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  return sorted.map(t => map[t] || t).join(' & ');
}
