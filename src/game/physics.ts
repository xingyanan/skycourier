import { PARCEL_R, WORLD, type Aabb, type IslandDef, type LevelConfig, type Point, type PreviewPath, type SimState } from "./types";

const DT_PREVIEW = 1 / 120;
const PREVIEW_FLIGHT = 3.15;
const LOST_AFTER = 3.4;
const REST_AFTER = 0.36;
const MIN_PULL = 18;

const islandCache = new WeakMap<LevelConfig, Map<string, IslandDef>>();

function islandById(level: LevelConfig, id: string): IslandDef {
  let map = islandCache.get(level);
  if (!map) {
    map = new Map(level.islands.map((island) => [island.id, island]));
    islandCache.set(level, map);
  }
  const island = map.get(id);
  if (!island) throw new Error(`missing island ${id}`);
  return island;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function islandCenterX(island: IslandDef, time: number): number {
  if (!island.motion) return island.x;
  const phase = island.motion.phase ?? 0;
  return island.x + Math.sin((time / island.motion.period) * Math.PI * 2 + phase) * island.motion.amplitude;
}

export function solidBox(island: IslandDef, time: number): Aabb {
  const x = islandCenterX(island, time);
  return {
    left: x - island.w / 2,
    right: x + island.w / 2,
    top: island.y,
    bottom: island.y + island.h,
  };
}

export function padCircle(level: LevelConfig, index: number, time: number): { x: number; y: number; r: number } {
  const pad = level.pads[index];
  const island = islandById(level, pad.islandId);
  return {
    x: islandCenterX(island, time) + pad.ox,
    y: island.y + pad.oy,
    r: pad.r,
  };
}

export function mailboxAabb(level: LevelConfig, time: number): Aabb & { cx: number; cy: number } {
  const box = level.mailbox;
  const island = islandById(level, box.islandId);
  const cx = islandCenterX(island, time) + box.ox;
  const cy = island.y + box.oy;
  return {
    cx,
    cy,
    left: cx - box.w / 2,
    right: cx + box.w / 2,
    top: cy - box.h / 2,
    bottom: cy + box.h / 2,
  };
}

export function createSim(level: LevelConfig, time = 0): SimState {
  return {
    body: { x: level.launch.x, y: level.launch.y, vx: 0, vy: 0 },
    time,
    flight: 0,
    onGround: 0,
    grounded: false,
    usedPad: level.pads.map(() => false),
    stamps: level.stamps.map(() => false),
    result: null,
    bounceCount: 0,
    bouncedThisStep: false,
    lastBounceX: 0,
    lastBounceY: 0,
  };
}

export function velocityFromPull(
  level: LevelConfig,
  pullX: number,
  pullY: number,
): { vx: number; vy: number; power: number } | null {
  const len = Math.hypot(pullX, pullY);
  if (len < MIN_PULL) return null;
  const power = Math.min(1, len / level.launch.maxPull);
  const speed = power * level.launch.maxSpeed;
  return {
    vx: (-pullX / len) * speed,
    vy: (-pullY / len) * speed,
    power,
  };
}

export function clampPull(level: LevelConfig, pullX: number, pullY: number): Point {
  const len = Math.hypot(pullX, pullY);
  const max = level.launch.maxPull;
  if (len <= max || len === 0) return { x: pullX, y: pullY };
  const scale = max / len;
  return { x: pullX * scale, y: pullY * scale };
}

function circleHitsAabb(x: number, y: number, r: number, box: Aabb): boolean {
  const cx = clamp(x, box.left, box.right);
  const cy = clamp(y, box.top, box.bottom);
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

function sweptCircleHitsCircle(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  radius: number,
  cx: number,
  cy: number,
  cr: number,
): boolean {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len2 = dx * dx + dy * dy;
  let t = 0;
  if (len2 > 0) t = clamp(((cx - x0) * dx + (cy - y0) * dy) / len2, 0, 1);
  const px = x0 + dx * t - cx;
  const py = y0 + dy * t - cy;
  const reach = radius + cr;
  return px * px + py * py <= reach * reach;
}

function sweptCircleHitsAabb(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  radius: number,
  box: Aabb,
): boolean {
  const steps = 4;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    if (circleHitsAabb(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, radius, box)) return true;
  }
  return false;
}

function resolveIsland(body: SimState["body"], box: Aabb): boolean {
  const nearestX = clamp(body.x, box.left, box.right);
  const nearestY = clamp(body.y, box.top, box.bottom);
  let dx = body.x - nearestX;
  let dy = body.y - nearestY;
  const distSq = dx * dx + dy * dy;
  if (distSq > PARCEL_R * PARCEL_R) return false;

  if (distSq === 0) {
    const left = body.x - box.left;
    const right = box.right - body.x;
    const top = body.y - box.top;
    const bottom = box.bottom - body.y;
    const min = Math.min(left, right, top, bottom);
    if (min === top) {
      body.y = box.top - PARCEL_R;
      land(body);
      return true;
    }
    if (min === bottom) {
      body.y = box.bottom + PARCEL_R;
      if (body.vy < 0) body.vy = -body.vy * 0.25;
      return false;
    }
    if (min === left) {
      body.x = box.left - PARCEL_R;
      if (body.vx > 0) body.vx = -body.vx * 0.25;
      return false;
    }
    body.x = box.right + PARCEL_R;
    if (body.vx < 0) body.vx = -body.vx * 0.25;
    return false;
  }

  const dist = Math.sqrt(distSq);
  const nx = dx / dist;
  const ny = dy / dist;
  const pen = PARCEL_R - dist;
  body.x += nx * pen;
  body.y += ny * pen;
  if (ny < -0.55) {
    land(body);
    return true;
  }
  const vn = body.vx * nx + body.vy * ny;
  if (vn < 0) {
    body.vx -= 1.25 * vn * nx;
    body.vy -= 1.25 * vn * ny;
  }
  return false;
}

function land(body: SimState["body"]): void {
  if (body.vy > 0) body.vy = body.vy > 560 ? -body.vy * 0.14 : 0;
  body.vx *= 0.55;
}

export function stepSim(level: LevelConfig, sim: SimState, dt: number): void {
  if (sim.result) return;
  sim.bouncedThisStep = false;
  sim.grounded = false;

  const x0 = sim.body.x;
  const y0 = sim.body.y;
  sim.body.vx += level.wind * dt;
  sim.body.vy += level.gravity * dt;
  sim.body.x += sim.body.vx * dt;
  sim.body.y += sim.body.vy * dt;
  sim.time += dt;
  sim.flight += dt;

  const body = sim.body;
  for (let i = 0; i < level.stamps.length; i += 1) {
    if (sim.stamps[i]) continue;
    const stamp = level.stamps[i];
    const dx = body.x - stamp.x;
    const dy = body.y - stamp.y;
    const reach = stamp.r + PARCEL_R;
    if (dx * dx + dy * dy <= reach * reach) sim.stamps[i] = true;
  }

  const slot = mailboxAabb(level, sim.time);
  if (sweptCircleHitsAabb(x0, y0, body.x, body.y, PARCEL_R * 0.72, slot)) {
    sim.result = "win";
    return;
  }

  for (let i = 0; i < level.pads.length; i += 1) {
    if (sim.usedPad[i] || body.vy < 70) continue;
    const pad = padCircle(level, i, sim.time);
    if (!sweptCircleHitsCircle(x0, y0, body.x, body.y, PARCEL_R, pad.x, pad.y, pad.r)) continue;
    const island = islandById(level, level.pads[i].islandId);
    const up = level.pads[i].boost + Math.max(0, body.vy) * level.pads[i].inherit;
    body.vx *= level.pads[i].vxScale;
    body.vy = -up;
    body.y = Math.min(body.y - 4, island.y - PARCEL_R - 4);
    sim.usedPad[i] = true;
    sim.bounceCount += 1;
    sim.bouncedThisStep = true;
    sim.lastBounceX = pad.x;
    sim.lastBounceY = pad.y;
    break;
  }

  if (!sim.bouncedThisStep) {
    for (const island of level.islands) {
      if (!island.solid) continue;
      if (resolveIsland(body, solidBox(island, sim.time))) sim.grounded = true;
    }
  }

  if (body.y > level.deathY) {
    sim.result = "sea";
    return;
  }
  if (body.x < -36 || body.x > WORLD.width + 36) {
    sim.result = "oob";
    return;
  }

  if (sim.grounded) {
    sim.onGround += dt;
    body.vx *= Math.max(0, 1 - 3.2 * dt);
    if (Math.abs(body.vy) < 36) body.vy = 0;
    if (sim.onGround > REST_AFTER && Math.hypot(body.vx, body.vy) < 78) sim.result = "rest";
  } else {
    sim.onGround = 0;
  }

  if (!sim.result && sim.flight > LOST_AFTER) sim.result = "lost";
}

function pointAlong(points: Point[], marks: number[], distance: number): Point {
  let index = 1;
  while (index < marks.length && marks[index] < distance) index += 1;
  const prev = marks[index - 1] ?? 0;
  const next = marks[index] ?? prev;
  const span = next - prev || 1;
  const t = clamp((distance - prev) / span, 0, 1);
  const a = points[index - 1] ?? points[0];
  const b = points[index] ?? a;
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** Full flight is simulated; only the first half of the arc is returned in `shown`. */
export function previewPaths(level: LevelConfig, vx: number, vy: number, time0: number): PreviewPath {
  const sim = createSim(level, time0);
  sim.body.vx = vx;
  sim.body.vy = vy;
  const points: Point[] = [{ x: sim.body.x, y: sim.body.y }];
  while (sim.flight < PREVIEW_FLIGHT && !sim.result) {
    stepSim(level, sim, DT_PREVIEW);
    points.push({ x: sim.body.x, y: sim.body.y });
  }

  const marks = [0];
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    marks.push(total);
  }

  const shown: Point[] = [];
  const rest: Point[] = [];
  const gap = 16;
  for (let distance = gap; distance < total; distance += gap) {
    const point = pointAlong(points, marks, distance);
    if (distance <= total * 0.5) shown.push(point);
    else rest.push(point);
  }
  return { shown, rest };
}

export interface Probe {
  result: SimState["result"];
  bounces: number;
  stamps: number;
}

export function probeShot(level: LevelConfig, angle: number, power: number, time0: number): Probe {
  const sim = createSim(level, time0);
  const speed = power * level.launch.maxSpeed;
  sim.body.vx = Math.cos(angle) * speed;
  sim.body.vy = Math.sin(angle) * speed;
  for (let i = 0; i < 460 && !sim.result; i += 1) stepSim(level, sim, DT_PREVIEW);
  let stamps = 0;
  for (const got of sim.stamps) if (got) stamps += 1;
  return { result: sim.result, bounces: sim.bounceCount, stamps };
}
