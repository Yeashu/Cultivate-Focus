export const POINT_MULTIPLIER = 1;

export function calculateFocusPoints(minutes: number, multiplier = POINT_MULTIPLIER) {
  return Math.max(0, Math.round(minutes * multiplier));
}
