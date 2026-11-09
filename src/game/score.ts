import type { LevelConfig } from "./types";

export function rateStars(level: LevelConfig, throws: number, stampCount: number): 1 | 2 | 3 {
  const base: 1 | 2 | 3 =
    throws <= level.threeStarThrows ? 3 : throws <= level.twoStarThrows ? 2 : 1;
  if (level.stampGrantsStar && stampCount > 0 && base < 3) {
    return (base + 1) as 2 | 3;
  }
  return base;
}

export function stampCount(flags: boolean[]): number {
  let count = 0;
  for (const got of flags) if (got) count += 1;
  return count;
}
