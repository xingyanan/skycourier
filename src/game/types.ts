/** Logical portrait stage. Gameplay never reads the DOM size. */
export const WORLD = { width: 390, height: 780 } as const;

export const PARCEL_R = 12;

export type SoundName = "throw" | "bounce" | "win" | "fail";

export type InputEvent =
  | { type: "pointer"; phase: "down" | "move" | "up" | "cancel"; x: number; y: number; id: number }
  | { type: "key"; code: string };

export type ResultKind = "win" | "sea" | "rest" | "oob" | "lost";

export type Phase = "ready" | "aiming" | "flying" | "fail" | "win";

export interface Point {
  x: number;
  y: number;
}

export interface Body {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface Motion {
  /** Pixels of horizontal travel either side of x. */
  amplitude: number;
  /** Seconds per full cycle. */
  period: number;
  phase?: number;
}

export interface IslandDef {
  id: string;
  /** Resting center x. */
  x: number;
  /** Collision and grass top. */
  y: number;
  w: number;
  /** Rock depth below the grass top. */
  h: number;
  solid: boolean;
  motion?: Motion;
  trees?: number;
  flowers?: number;
}

export interface PadDef {
  islandId: string;
  ox: number;
  oy: number;
  r: number;
  /** Upward speed applied on the first hit of a throw. */
  boost: number;
  /** Extra upward speed from the downward impact speed. */
  inherit: number;
  vxScale: number;
}

export interface MailboxDef {
  islandId: string;
  ox: number;
  oy: number;
  w: number;
  h: number;
}

export interface StampDef {
  x: number;
  y: number;
  r: number;
}

export interface LaunchDef {
  x: number;
  y: number;
  maxPull: number;
  maxSpeed: number;
}

export interface LevelConfig {
  id: number;
  name: string;
  hint: [string, string];
  gravity: number;
  /** Horizontal acceleration in px/s². Positive pushes right. */
  wind: number;
  deathY: number;
  threeStarThrows: number;
  twoStarThrows: number;
  /** One collected stamp in the same throw adds a star, capped at 3. */
  stampGrantsStar: boolean;
  launch: LaunchDef;
  islands: IslandDef[];
  pads: PadDef[];
  mailbox: MailboxDef;
  stamps: StampDef[];
}

export interface Aabb {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface SimState {
  body: Body;
  time: number;
  flight: number;
  onGround: number;
  grounded: boolean;
  usedPad: boolean[];
  stamps: boolean[];
  result: ResultKind | null;
  bounceCount: number;
  bouncedThisStep: boolean;
  lastBounceX: number;
  lastBounceY: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
}

export interface PreviewPath {
  shown: Point[];
  rest: Point[];
}

export interface RenderModel {
  level: LevelConfig;
  levelIndex: number;
  levelCount: number;
  phase: Phase;
  throws: number;
  worldTime: number;
  animTime: number;
  sim: SimState;
  pull: Point | null;
  power: number;
  preview: PreviewPath | null;
  failText: string;
  winStars: number;
  particles: Particle[];
  pressedId: string | null;
}
