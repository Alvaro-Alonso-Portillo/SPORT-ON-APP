import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a consistent, visually appealing color from a user's UID.
 * @param uid The user's unique identifier.
 * @returns An HSL color string.
 */
export function generateColorFromUID(uid: string): string {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = uid.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Ensure 32bit integer
  }
  // Use a fixed saturation and lightness for better aesthetics
  const hue = hash % 360;
  const saturation = 70; // A nice, rich saturation
  const lightness = 45;  // Not too light, not too dark
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Extracts initials from a user's name.
 * @param name The full name of the user.
 * @returns A string with the user's initials (e.g., "AM").
 */
export function getInitials(name: string): string {
  if (!name) return "";
  const names = name.trim().split(' ');
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  const firstInitial = names[0].charAt(0);
  const lastInitial = names[names.length - 1].charAt(0);
  return `${firstInitial}${lastInitial}`.toUpperCase();
}
