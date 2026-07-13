import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function ageFromDob(dob) {
  if (!dob) return '—'
  const birth = new Date(dob)
  const now = new Date()
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
  if (now.getDate() < birth.getDate()) months--
  const years = Math.floor(months / 12)
  const rem = months % 12
  if (years === 0) return `${rem} mo old`
  return rem === 0 ? `${years} yr old` : `${years} yr ${rem} mo old`
}