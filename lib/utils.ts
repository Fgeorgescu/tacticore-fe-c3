import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatScore(value: number, decimals = 1): string {
  const rounded = Number(value.toFixed(decimals))
  return rounded % 1 === 0 ? rounded.toString() : value.toFixed(decimals)
}
