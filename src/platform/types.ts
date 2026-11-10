import type { InputEvent, SoundName } from "../game/types";

export type { InputEvent, SoundName };

/**
 * The game talks only to this host. Browser and WeChat each implement it.
 * Coordinates are already in the 390×780 logical space.
 */
export interface GameHost {
  readonly ctx: CanvasRenderingContext2D;
  onInput(handler: (event: InputEvent) => void): void;
  onFrame(handler: (dt: number) => void): void;
  play(sound: SoundName): void;
  setCursor(cursor: string): void;
}
