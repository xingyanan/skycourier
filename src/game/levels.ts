import type { IslandDef, LevelConfig } from "./types";

/**
 * 新关卡只往这个数组里加配置。物理不要按关卡编号写分支。
 * 坐标是 390×780 的逻辑像素，y 向下。
 */

function decor(): IslandDef[] {
  return [
    { id: "far-a", x: 62, y: 148, w: 86, h: 48, solid: false, trees: 2, flowers: 2 },
    { id: "far-b", x: 196, y: 196, w: 54, h: 34, solid: false, trees: 1, flowers: 1 },
    { id: "far-c", x: 332, y: 132, w: 98, h: 52, solid: false, trees: 2, flowers: 2 },
  ];
}

const sunny: LevelConfig = {
  id: 1,
  name: "晴空投递",
  hint: ["按住包裹向后拖，松手投出", "紫色弹板会把包裹向上弹起"],
  gravity: 1500,
  wind: 0,
  deathY: 748,
  threeStarThrows: 1,
  twoStarThrows: 2,
  stampGrantsStar: false,
  launch: { x: 178, y: 404, maxPull: 96, maxSpeed: 980 },
  islands: [
    { id: "launch", x: 86, y: 424, w: 148, h: 78, solid: true, trees: 1, flowers: 4 },
    { id: "pad", x: 214, y: 548, w: 118, h: 68, solid: true, trees: 0, flowers: 2 },
    { id: "mail", x: 324, y: 378, w: 120, h: 72, solid: true, trees: 2, flowers: 3 },
    ...decor(),
  ],
  pads: [{ islandId: "pad", ox: 0, oy: -4, r: 40, boost: 760, inherit: 0.08, vxScale: 0.92 }],
  mailbox: { islandId: "mail", ox: -4, oy: -34, w: 58, h: 44 },
  stamps: [],
};

const windy: LevelConfig = {
  id: 2,
  name: "侧风航线",
  hint: ["今天的风往右吹", "同样的力度会飞得更远"],
  gravity: 1500,
  wind: 150,
  deathY: 748,
  threeStarThrows: 1,
  twoStarThrows: 2,
  stampGrantsStar: false,
  launch: { x: 164, y: 418, maxPull: 96, maxSpeed: 940 },
  islands: [
    { id: "launch", x: 78, y: 436, w: 146, h: 74, solid: true, trees: 1, flowers: 3 },
    { id: "pad", x: 198, y: 560, w: 108, h: 64, solid: true, trees: 0, flowers: 2 },
    { id: "mail", x: 326, y: 372, w: 116, h: 70, solid: true, trees: 2, flowers: 3 },
    ...decor(),
  ],
  pads: [{ islandId: "pad", ox: 0, oy: -2, r: 32, boost: 780, inherit: 0.1, vxScale: 0.96 }],
  mailbox: { islandId: "mail", ox: 4, oy: -32, w: 60, h: 46 },
  stamps: [],
};

const moving: LevelConfig = {
  id: 3,
  name: "游动邮箱",
  hint: ["邮箱岛会左右躲开", "等它走到落点再松手"],
  gravity: 1500,
  wind: 0,
  deathY: 748,
  threeStarThrows: 1,
  twoStarThrows: 2,
  stampGrantsStar: false,
  launch: { x: 156, y: 470, maxPull: 100, maxSpeed: 900 },
  islands: [
    { id: "launch", x: 72, y: 490, w: 132, h: 70, solid: true, trees: 1, flowers: 3 },
    {
      id: "mail",
      x: 292,
      y: 430,
      w: 86,
      h: 58,
      solid: true,
      trees: 1,
      flowers: 2,
      motion: { amplitude: 58, period: 5.4 },
    },
    ...decor(),
  ],
  pads: [],
  mailbox: { islandId: "mail", ox: 0, oy: -24, w: 32, h: 22 },
  stamps: [],
};

export const levels: LevelConfig[] = [sunny, windy, moving];

export function assertLevels(list: LevelConfig[] = levels): void {
  const seen = new Set<number>();
  for (const level of list) {
    if (seen.has(level.id)) throw new Error(`duplicate level id ${level.id}`);
    seen.add(level.id);
    if (!(level.gravity > 0)) throw new Error(`${level.name} gravity`);
    if (!(level.launch.maxPull > 24)) throw new Error(`${level.name} maxPull`);
    if (!(level.launch.maxSpeed > 200)) throw new Error(`${level.name} maxSpeed`);
    if (level.threeStarThrows < 1 || level.twoStarThrows < level.threeStarThrows) {
      throw new Error(`${level.name} star thresholds`);
    }
    const ids = new Set<string>();
    for (const island of level.islands) {
      if (ids.has(island.id)) throw new Error(`${level.name} duplicate island ${island.id}`);
      ids.add(island.id);
      if (island.solid && island.y + island.h > level.deathY - 16) {
        throw new Error(`${level.name} island ${island.id} touches the sea`);
      }
      if (island.motion && !(island.motion.period > 0.3)) {
        throw new Error(`${level.name} motion period`);
      }
    }
    if (!ids.has(level.mailbox.islandId)) throw new Error(`${level.name} mailbox island`);
    for (const pad of level.pads) {
      if (!ids.has(pad.islandId)) throw new Error(`${level.name} pad island`);
      if (!(pad.r > 4) || !(pad.boost > 0)) throw new Error(`${level.name} pad`);
    }
    if (!(level.mailbox.w > 8) || !(level.mailbox.h > 8)) throw new Error(`${level.name} mailbox size`);
    if (level.launch.y < 40 || level.launch.y > level.deathY - 80) {
      throw new Error(`${level.name} launch height`);
    }
  }
}
