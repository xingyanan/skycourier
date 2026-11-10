import { levels, assertLevels } from "./levels";
import { clampPull, createSim, previewPaths, stepSim, velocityFromPull } from "./physics";
import { rateStars, stampCount } from "./score";
import { buttonsFor, failCopy, hitButton } from "./ui";
import type {
  InputEvent,
  LevelConfig,
  Particle,
  Phase,
  Point,
  PreviewPath,
  RenderModel,
  SimState,
  SoundName,
} from "./types";

const AIM_R = 78;
const FAIL_HOLD = 0.55;

type Gesture =
  | { kind: "none" }
  | { kind: "button"; id: string; pointerId: number }
  | { kind: "aim"; pointerId: number };

export interface PublicState {
  phase: Phase;
  throws: number;
  levelIndex: number;
  stars: number;
  result: SimState["result"];
  previewShown: number;
  previewRest: number;
  worldTime: number;
  bounceCount: number;
  x: number;
  y: number;
}

export interface Session {
  update(dt: number): void;
  pointer(event: InputEvent): void;
  loadLevel(index: number): void;
  getState(): PublicState;
  takeSounds(): SoundName[];
  model(): RenderModel;
  cursor(): string;
}

export function createSession(): Session {
  assertLevels(levels);

  let levelIndex = 0;
  let phase: Phase = "ready";
  let throws = 0;
  let worldTime = 0;
  let animTime = 0;
  let sim: SimState = createSim(levels[0], 0);
  let pull: Point | null = null;
  let gesture: Gesture = { kind: "none" };
  let pressedId: string | null = null;
  let failText = "";
  let failLeft = 0;
  let winStars = 0;
  let particles: Particle[] = [];
  const sounds: SoundName[] = [];

  function level(): LevelConfig {
    return levels[levelIndex];
  }

  function loadLevel(index: number): void {
    const count = levels.length;
    levelIndex = ((index % count) + count) % count;
    phase = "ready";
    throws = 0;
    worldTime = 0;
    sim = createSim(level(), 0);
    pull = null;
    gesture = { kind: "none" };
    pressedId = null;
    failText = "";
    failLeft = 0;
    winStars = 0;
    particles = [];
  }

  function burst(x: number, y: number, colors: string[], count: number, speed: number): void {
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.2;
      const vel = speed * (0.45 + Math.random() * 0.7);
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * vel,
        vy: Math.sin(angle) * vel - 30,
        life: 0.45 + Math.random() * 0.25,
        max: 0.7,
        color: colors[i % colors.length],
        size: 2 + Math.random() * 2.2,
      });
    }
    if (particles.length > 64) particles.splice(0, particles.length - 64);
  }

  function releaseAim(): void {
    const current = level();
    const shot = pull ? velocityFromPull(current, pull.x, pull.y) : null;
    pull = null;
    if (!shot) {
      phase = "ready";
      return;
    }
    sim = createSim(current, worldTime);
    sim.body.vx = shot.vx;
    sim.body.vy = shot.vy;
    phase = "flying";
    throws += 1;
    sounds.push("throw");
  }

  function activate(id: string): void {
    if (id === "reset" || id === "retry") loadLevel(levelIndex);
    else if (id === "badge" || id === "next") loadLevel(levelIndex + 1);
  }

  function currentPreview(): PreviewPath | null {
    if (phase !== "aiming" || !pull) return null;
    const shot = velocityFromPull(level(), pull.x, pull.y);
    if (!shot) return null;
    return previewPaths(level(), shot.vx, shot.vy, worldTime);
  }

  function pointer(event: InputEvent): void {
    if (event.type === "key") {
      if (event.code === "KeyR") loadLevel(levelIndex);
      if (phase === "flying") return;
      if (event.code === "Digit1") loadLevel(0);
      else if (event.code === "Digit2") loadLevel(1);
      else if (event.code === "Digit3") loadLevel(2);
      return;
    }

    if (event.phase === "down") {
      if (gesture.kind !== "none") return;
      const button = hit(event.x, event.y);
      if (button) {
        gesture = { kind: "button", id: button.id, pointerId: event.id };
        pressedId = button.id;
        return;
      }
      if (phase !== "ready") return;
      const dx = event.x - level().launch.x;
      const dy = event.y - level().launch.y;
      if (dx * dx + dy * dy <= AIM_R * AIM_R) {
        gesture = { kind: "aim", pointerId: event.id };
        phase = "aiming";
        pull = clampPull(level(), dx, dy);
      }
      return;
    }

    if (gesture.kind === "aim" && event.id === gesture.pointerId && event.phase === "move") {
      pull = clampPull(level(), event.x - level().launch.x, event.y - level().launch.y);
      return;
    }

    if (gesture.kind === "button" && event.id === gesture.pointerId && event.phase === "move") {
      const button = hit(event.x, event.y);
      pressedId = button && button.id === gesture.id ? button.id : null;
      return;
    }

    if (gesture.kind !== "none" && event.id === gesture.pointerId && (event.phase === "up" || event.phase === "cancel")) {
      if (gesture.kind === "button") {
        const button = event.phase === "up" ? hit(event.x, event.y) : null;
        const id = button && button.id === gesture.id ? gesture.id : null;
        gesture = { kind: "none" };
        pressedId = null;
        if (id) activate(id);
        return;
      }
      gesture = { kind: "none" };
      if (event.phase === "cancel") {
        pull = null;
        phase = "ready";
        return;
      }
      releaseAim();
    }
  }

  function hit(x: number, y: number) {
    return hitButton(buttonsFor(phase), x, y);
  }

  function update(dt: number): void {
    const step = Math.min(Math.max(dt, 0), 0.05);
    animTime += step;
    for (const particle of particles) {
      particle.life -= step;
      particle.vy += 320 * step;
      particle.x += particle.vx * step;
      particle.y += particle.vy * step;
    }
    particles = particles.filter((particle) => particle.life > 0);

    if (phase === "ready" || phase === "aiming") {
      worldTime += step;
      return;
    }
    if (phase === "fail") {
      failLeft -= step;
      if (failLeft <= 0) {
        phase = "ready";
        sim = createSim(level(), worldTime);
        pull = null;
      }
      return;
    }
    if (phase !== "flying") return;

    stepSim(level(), sim, step);
    worldTime = sim.time;
    if (sim.bouncedThisStep) {
      sounds.push("bounce");
      burst(sim.lastBounceX, sim.lastBounceY, ["#ffffff", "#d9c8ff"], 8, 110);
    }
    if (sim.result === "win") {
      phase = "win";
      winStars = rateStars(level(), throws, stampCount(sim.stamps));
      sounds.push("win");
      burst(sim.body.x, sim.body.y, ["#f2c14d", "#ffd0e0", "#ffffff"], 14, 150);
    } else if (sim.result) {
      phase = "fail";
      failLeft = FAIL_HOLD;
      failText = failCopy(sim.result);
      sounds.push("fail");
    }
  }

  function model(): RenderModel {
    const shot = phase === "aiming" && pull ? velocityFromPull(level(), pull.x, pull.y) : null;
    return {
      level: level(),
      levelIndex,
      levelCount: levels.length,
      phase,
      throws,
      worldTime,
      animTime,
      sim,
      pull,
      power: shot ? shot.power : pull ? Math.min(1, Math.hypot(pull.x, pull.y) / level().launch.maxPull) : 0,
      preview: currentPreview(),
      failText,
      winStars,
      particles,
      pressedId,
    };
  }

  function getState(): PublicState {
    const preview = currentPreview();
    return {
      phase,
      throws,
      levelIndex,
      stars: winStars,
      result: sim.result,
      previewShown: preview?.shown.length ?? 0,
      previewRest: preview?.rest.length ?? 0,
      worldTime,
      bounceCount: sim.bounceCount,
      x: sim.body.x,
      y: sim.body.y,
    };
  }

  loadLevel(0);

  return {
    update,
    pointer,
    loadLevel,
    getState,
    takeSounds: () => sounds.splice(0, sounds.length),
    model,
    cursor: () => (gesture.kind === "aim" ? "grabbing" : "default"),
  };
}
