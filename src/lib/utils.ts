import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import humanDuration from "humanize-duration";



export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function formatMeetingDuration(durationInSeconds: number) {
  return humanDuration(durationInSeconds * 1000, {
    largest: 1, 
    round: true, 
    units: ["h", "m", "s"], 
  });
}