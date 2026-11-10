import type { IslandDef, LevelConfig } from "./types";

/**
 * 新关卡只往这个数组里加配置。物理不要按关卡编号写分支。
 * 坐标是 390×780 的逻辑像素，y 向下。
 */

function decor(variant = 0): IslandDef[] {
  const nudge = (n: number) => ((variant * 19 + n * 13) % 22) - 10;
  return [
    { id: "far-a", x: 62 + nudge(1), y: 146, w: 86, h: 48, solid: false, trees: 2, flowers: 2 },
    { id: "far-b", x: 196 + nudge(2), y: 196, w: 54, h: 34, solid: false, trees: 1, flowers: 1 },
    { id: "far-c", x: 324 + nudge(3), y: 128, w: 90, h: 50, solid: false, trees: 2, flowers: 2 },
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

const twinPads: LevelConfig = {
  id: 4,
  name: "双弹板",
  hint: ["左右两块弹板都能把包裹送上去", "一次投递里用到哪一块都行"],
  gravity: 1500,
  wind: 0,
  deathY: 748,
  threeStarThrows: 2,
  twoStarThrows: 3,
  stampGrantsStar: false,
  launch: { x: 150, y: 430, maxPull: 100, maxSpeed: 960 },
  islands: [
    { id: "launch", x: 78, y: 450, w: 140, h: 70, solid: true, trees: 1, flowers: 3 },
    { id: "pad-a", x: 188, y: 590, w: 100, h: 58, solid: true, flowers: 1 },
    { id: "pad-b", x: 308, y: 570, w: 96, h: 56, solid: true, flowers: 1 },
    { id: "mail", x: 332, y: 292, w: 108, h: 62, solid: true, trees: 1, flowers: 2 },
    ...decor(4),
  ],
  pads: [
    { islandId: "pad-a", ox: 0, oy: -2, r: 30, boost: 860, inherit: 0.08, vxScale: 0.94 },
    { islandId: "pad-b", ox: 0, oy: -2, r: 30, boost: 900, inherit: 0.1, vxScale: 0.92 },
  ],
  mailbox: { islandId: "mail", ox: 0, oy: -30, w: 54, h: 40 },
  stamps: [],
};

const narrow: LevelConfig = {
  id: 5,
  name: "窄口",
  hint: ["邮箱口变窄了", "弹板还在，对准投递口再松手"],
  gravity: 1500,
  wind: 0,
  deathY: 748,
  threeStarThrows: 2,
  twoStarThrows: 4,
  stampGrantsStar: false,
  launch: { x: 170, y: 410, maxPull: 96, maxSpeed: 960 },
  islands: [
    { id: "launch", x: 84, y: 430, w: 146, h: 74, solid: true, trees: 1, flowers: 3 },
    { id: "pad", x: 210, y: 560, w: 112, h: 64, solid: true, flowers: 2 },
    { id: "mail", x: 318, y: 360, w: 112, h: 68, solid: true, trees: 1, flowers: 2 },
    ...decor(5),
  ],
  pads: [{ islandId: "pad", ox: 0, oy: -2, r: 34, boost: 800, inherit: 0.1, vxScale: 0.94 }],
  mailbox: { islandId: "mail", ox: 0, oy: -28, w: 26, h: 20 },
  stamps: [],
};

const headwind: LevelConfig = {
  id: 6,
  name: "逆风",
  hint: ["风往左推", "同样的拖法会飞得更近"],
  gravity: 1500,
  wind: -160,
  deathY: 748,
  threeStarThrows: 2,
  twoStarThrows: 3,
  stampGrantsStar: false,
  launch: { x: 168, y: 418, maxPull: 100, maxSpeed: 980 },
  islands: [
    { id: "launch", x: 86, y: 438, w: 144, h: 72, solid: true, trees: 1, flowers: 3 },
    { id: "pad", x: 206, y: 568, w: 108, h: 62, solid: true, flowers: 2 },
    { id: "mail", x: 292, y: 368, w: 116, h: 68, solid: true, trees: 1, flowers: 2 },
    ...decor(6),
  ],
  pads: [{ islandId: "pad", ox: 0, oy: -2, r: 32, boost: 800, inherit: 0.1, vxScale: 0.96 }],
  mailbox: { islandId: "mail", ox: 0, oy: -30, w: 52, h: 38 },
  stamps: [],
};

const stampRun: LevelConfig = {
  id: 7,
  name: "云间邮票",
  hint: ["航线中间有一张邮票", "同一投里接到，星级再加 1"],
  gravity: 1500,
  wind: 0,
  deathY: 748,
  threeStarThrows: 2,
  twoStarThrows: 4,
  stampGrantsStar: true,
  launch: { x: 172, y: 408, maxPull: 96, maxSpeed: 960 },
  islands: [
    { id: "launch", x: 86, y: 428, w: 146, h: 74, solid: true, trees: 1, flowers: 3 },
    { id: "pad", x: 214, y: 552, w: 114, h: 64, solid: true, flowers: 2 },
    { id: "mail", x: 320, y: 372, w: 116, h: 68, solid: true, trees: 1, flowers: 2 },
    ...decor(7),
  ],
  pads: [{ islandId: "pad", ox: 0, oy: -2, r: 36, boost: 780, inherit: 0.08, vxScale: 0.94 }],
  mailbox: { islandId: "mail", ox: 0, oy: -30, w: 50, h: 38 },
  stamps: [{ x: 250, y: 470, r: 20 }],
};

const stacked: LevelConfig = {
  id: 8,
  name: "错层",
  hint: ["邮箱比弹板高很多", "要估弹起之后还能飞多高"],
  gravity: 1500,
  wind: 0,
  deathY: 748,
  threeStarThrows: 2,
  twoStarThrows: 4,
  stampGrantsStar: false,
  launch: { x: 156, y: 500, maxPull: 100, maxSpeed: 980 },
  islands: [
    { id: "launch", x: 78, y: 520, w: 140, h: 68, solid: true, trees: 1, flowers: 2 },
    { id: "pad", x: 210, y: 640, w: 112, h: 58, solid: true, flowers: 1 },
    { id: "mail", x: 300, y: 300, w: 118, h: 64, solid: true, trees: 1, flowers: 2 },
    ...decor(8),
  ],
  pads: [{ islandId: "pad", ox: 0, oy: -2, r: 36, boost: 980, inherit: 0.12, vxScale: 0.9 }],
  mailbox: { islandId: "mail", ox: 0, oy: -28, w: 50, h: 36 },
  stamps: [],
};

const pendulum: LevelConfig = {
  id: 9,
  name: "钟摆",
  hint: ["邮箱岛摆得更快", "看清它走到落点再松手"],
  gravity: 1500,
  wind: 0,
  deathY: 748,
  threeStarThrows: 2,
  twoStarThrows: 4,
  stampGrantsStar: false,
  launch: { x: 150, y: 468, maxPull: 100, maxSpeed: 920 },
  islands: [
    { id: "launch", x: 74, y: 488, w: 136, h: 68, solid: true, trees: 1, flowers: 2 },
    {
      id: "mail",
      x: 286,
      y: 400,
      w: 108,
      h: 62,
      solid: true,
      flowers: 2,
      motion: { amplitude: 64, period: 3.4 },
    },
    ...decor(9),
  ],
  pads: [],
  mailbox: { islandId: "mail", ox: 0, oy: -28, w: 48, h: 34 },
  stamps: [],
};

const windNarrow: LevelConfig = {
  id: 10,
  name: "顺风窄口",
  hint: ["风往右，邮箱口更窄", "力度要比没风时轻一点"],
  gravity: 1500,
  wind: 130,
  deathY: 748,
  threeStarThrows: 2,
  twoStarThrows: 4,
  stampGrantsStar: false,
  launch: { x: 164, y: 416, maxPull: 96, maxSpeed: 940 },
  islands: [
    { id: "launch", x: 80, y: 436, w: 142, h: 70, solid: true, trees: 1, flowers: 2 },
    { id: "pad", x: 198, y: 566, w: 108, h: 62, solid: true, flowers: 1 },
    { id: "mail", x: 312, y: 368, w: 112, h: 66, solid: true, trees: 1, flowers: 2 },
    ...decor(10),
  ],
  pads: [{ islandId: "pad", ox: 0, oy: -2, r: 32, boost: 780, inherit: 0.1, vxScale: 0.96 }],
  mailbox: { islandId: "mail", ox: 0, oy: -28, w: 28, h: 20 },
  stamps: [],
};

const twoClocks: LevelConfig = {
  id: 11,
  name: "双岛错拍",
  hint: ["弹板岛和邮箱岛节奏不同", "等两座岛一起走到落点"],
  gravity: 1500,
  wind: 0,
  deathY: 748,
  threeStarThrows: 2,
  twoStarThrows: 4,
  stampGrantsStar: false,
  launch: { x: 148, y: 446, maxPull: 100, maxSpeed: 960 },
  islands: [
    { id: "launch", x: 76, y: 466, w: 136, h: 68, solid: true, trees: 1, flowers: 2 },
    {
      id: "pad",
      x: 198,
      y: 600,
      w: 104,
      h: 58,
      solid: true,
      flowers: 1,
      motion: { amplitude: 26, period: 4 },
    },
    {
      id: "mail",
      x: 300,
      y: 352,
      w: 112,
      h: 64,
      solid: true,
      flowers: 2,
      motion: { amplitude: 42, period: 2 },
    },
    ...decor(11),
  ],
  pads: [{ islandId: "pad", ox: 0, oy: -2, r: 30, boost: 860, inherit: 0.1, vxScale: 0.94 }],
  mailbox: { islandId: "mail", ox: 0, oy: -28, w: 46, h: 34 },
  stamps: [],
};

const night: LevelConfig = {
  id: 12,
  name: "灯塔夜航",
  hint: ["侧风、移动邮箱，还有一张邮票", "先看风向，再等邮箱走到落点"],
  gravity: 1500,
  wind: 90,
  deathY: 748,
  threeStarThrows: 2,
  twoStarThrows: 4,
  stampGrantsStar: true,
  launch: { x: 156, y: 456, maxPull: 100, maxSpeed: 960 },
  islands: [
    { id: "launch", x: 78, y: 476, w: 140, h: 68, solid: true, trees: 1, flowers: 2 },
    { id: "pad", x: 196, y: 612, w: 108, h: 58, solid: true, flowers: 1 },
    {
      id: "mail",
      x: 304,
      y: 360,
      w: 114,
      h: 64,
      solid: true,
      flowers: 2,
      motion: { amplitude: 36, period: 4.6 },
    },
    ...decor(12),
  ],
  pads: [{ islandId: "pad", ox: 0, oy: -2, r: 32, boost: 840, inherit: 0.1, vxScale: 0.94 }],
  mailbox: { islandId: "mail", ox: 0, oy: -28, w: 44, h: 32 },
  stamps: [{ x: 230, y: 500, r: 18 }],
};

export const levels: LevelConfig[] = [
  sunny,
  windy,
  moving,
  twinPads,
  narrow,
  headwind,
  stampRun,
  stacked,
  pendulum,
  windNarrow,
  twoClocks,
  night,
];

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
