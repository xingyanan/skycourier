import { levels } from "./levels";
import { probeShot } from "./physics";
import type { LevelConfig, Point } from "./types";

export interface Recipe {
  levelIndex: number;
  angle: number;
  power: number;
  time0: number;
  bounces: number;
}

interface Shot {
  angle: number;
  power: number;
  time0: number;
  bounces: number;
}

export interface Assessment {
  ok: boolean;
  report: string;
  recipes: Recipe[];
}

export function pullForShot(level: LevelConfig, angle: number, power: number): Point {
  const len = power * level.launch.maxPull;
  return { x: -Math.cos(angle) * len, y: -Math.sin(angle) * len };
}

function angleDiff(a: number, b: number): number {
  let diff = Math.abs(a - b) % (Math.PI * 2);
  if (diff > Math.PI) diff = Math.PI * 2 - diff;
  return diff;
}

function search(level: LevelConfig, angleStep: number, powerStep: number, times: number[]): Shot[] {
  const wins: Shot[] = [];
  for (let deg = -176; deg <= 180; deg += angleStep) {
    const angle = (deg * Math.PI) / 180;
    for (let power = 0.28; power <= 1.001; power += powerStep) {
      const clamped = Math.min(1, Number(power.toFixed(3)));
      for (const time0 of times) {
        const probe = probeShot(level, angle, clamped, time0);
        if (probe.result === "win") wins.push({ angle, power: clamped, time0, bounces: probe.bounces });
      }
    }
  }
  return wins;
}

function densest(shots: Shot[]): Shot {
  let best = shots[0];
  let bestScore = -1;
  for (const shot of shots) {
    let score = 0;
    for (const other of shots) {
      if (angleDiff(shot.angle, other.angle) < (10 * Math.PI) / 180 && Math.abs(shot.power - other.power) < 0.13) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = shot;
    }
  }
  return best;
}

function timeSamples(period: number, step: number): number[] {
  const out: number[] = [];
  for (let time = 0; time < period - 1e-6; time += step) out.push(Number(time.toFixed(4)));
  return out;
}

function circularDist(a: number, b: number, period: number): number {
  const dist = Math.abs(a - b) % period;
  return Math.min(dist, period - dist);
}

function winningSpan(times: number[], period: number): number {
  const unique = [...new Set(times.map((time) => Number(time.toFixed(4))))].sort((a, b) => a - b);
  if (unique.length < 2) return 0;
  let maxGap = unique[0] + period - unique[unique.length - 1];
  for (let i = 1; i < unique.length; i += 1) maxGap = Math.max(maxGap, unique[i] - unique[i - 1]);
  return period - maxGap;
}

function phrase(x: number, y: number): string {
  const horizontal = x < -10 ? "左" : x > 10 ? "右" : "";
  const vertical = y < -10 ? "上" : y > 10 ? "下" : "";
  return horizontal || vertical ? `向${vertical}${horizontal}` : "几乎不拖";
}

function describe(level: LevelConfig, shot: Shot): string {
  const pull = pullForShot(level, shot.angle, shot.power);
  const deg = Math.round((shot.angle * 180) / Math.PI);
  return `力度 ${Math.round(shot.power * 100)}%，速度角 ${deg}°，从包裹${phrase(pull.x, pull.y)}拖约 ${Math.round(Math.hypot(pull.x, pull.y))} 像素`;
}

function rangeText(shots: Shot[], key: "angle" | "power"): string {
  if (shots.length === 0) return "无";
  const values = shots.map((shot) => (key === "angle" ? (shot.angle * 180) / Math.PI : shot.power));
  const min = Math.min(...values);
  const max = Math.max(...values);
  return key === "angle" ? `${min.toFixed(0)}°~${max.toFixed(0)}°` : `${Math.round(min * 100)}%~${Math.round(max * 100)}%`;
}

export function assessLevels(list: LevelConfig[] = levels): Assessment {
  const started = performance.now();
  const lines: string[] = [];
  const recipes: Recipe[] = [];
  let ok = true;

  const sunny = search(list[0], 4, 0.08, [0]);
  const sunnyBounce = sunny.filter((shot) => shot.bounces > 0);
  lines.push(
    `第1关 ${list[0].name}：弹板解 ${sunnyBounce.length} 个，直投解 ${sunny.length - sunnyBounce.length} 个，角度 ${rangeText(sunnyBounce, "angle")}，力度 ${rangeText(sunnyBounce, "power")}`,
  );
  if (sunnyBounce.length < 6) ok = false;
  if (sunnyBounce.length > 0) {
    const shot = densest(sunnyBounce);
    recipes.push({ levelIndex: 0, ...shot });
    lines.push(`  示例 ${describe(list[0], shot)}`);
  }

  const windy = search(list[1], 4, 0.08, [0]);
  lines.push(`第2关 ${list[1].name}：可解 ${windy.length} 个，角度 ${rangeText(windy, "angle")}，力度 ${rangeText(windy, "power")}`);
  if (windy.length < 6) ok = false;
  if (windy.length > 0) {
    const shot = densest(windy);
    recipes.push({ levelIndex: 1, ...shot });
    lines.push(`  示例 ${describe(list[1], shot)}`);
  }

  const moving = list[2];
  const period = moving.islands.find((island) => island.motion)?.motion?.period ?? 4.8;
  const times = timeSamples(period, 0.25);
  const timed = search(moving, 6, 0.1, times);
  const groups = new Map<string, Shot[]>();
  for (const shot of timed) {
    const key = `${shot.angle.toFixed(5)}|${shot.power.toFixed(3)}`;
    const bucket = groups.get(key);
    if (bucket) bucket.push(shot);
    else groups.set(key, [shot]);
  }
  let bestShots: Shot[] = [];
  let bestSpan = 0;
  for (const bucket of groups.values()) {
    const span = winningSpan(
      bucket.map((shot) => shot.time0),
      period,
    );
    if (span > bestSpan) {
      bestSpan = span;
      bestShots = bucket;
    }
  }
  lines.push(`第3关 ${moving.name}：命中样本 ${timed.length} 个，最宽松手窗口 ${bestSpan.toFixed(2)} 秒`);
  if (bestSpan < 0.45 || bestShots.length < 3) ok = false;
  if (bestShots.length > 0) {
    let chosen = bestShots[0];
    let neighbors = -1;
    for (const shot of bestShots) {
      const count = bestShots.filter((other) => circularDist(shot.time0, other.time0, period) <= 0.3).length;
      if (count > neighbors) {
        neighbors = count;
        chosen = shot;
      }
    }
    recipes.push({ levelIndex: 2, ...chosen });
    lines.push(`  示例 ${describe(moving, chosen)}，松手时刻 ${chosen.time0.toFixed(2)} 秒`);
  }

  lines.push(`搜索耗时 ${Math.round(performance.now() - started)} ms`);
  if (!ok) lines.push("有关卡的可解窗口太窄。");
  return { ok, report: lines.join("\n"), recipes };
}
