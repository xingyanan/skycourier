import type { InputEvent } from "../../game/types";
import type { GameHost, SoundName } from "../types";

export function createBrowserHost(root: HTMLElement, logicalW: number, logicalH: number): GameHost {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("role", "application");
  canvas.setAttribute("aria-label", "天空快递。按住包裹向后拖，松手投出。掉进云海会马上重投。");
  root.replaceChildren(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("无法创建画布");

  let dpr = 1;
  const fit = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const scale = Math.min(window.innerWidth / logicalW, window.innerHeight / logicalH);
    canvas.style.width = `${Math.max(1, logicalW * scale)}px`;
    canvas.style.height = `${Math.max(1, logicalH * scale)}px`;
    canvas.width = Math.max(1, Math.round(logicalW * dpr));
    canvas.height = Math.max(1, Math.round(logicalH * dpr));
  };
  fit();
  window.addEventListener("resize", fit);

  let onInput: (event: InputEvent) => void = () => {};
  let onFrame: (dt: number) => void = () => {};
  let started = false;

  const locate = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 1;
    const height = rect.height || 1;
    return {
      x: ((event.clientX - rect.left) / width) * logicalW,
      y: ((event.clientY - rect.top) / height) * logicalH,
    };
  };

  const send = (phase: "down" | "move" | "up" | "cancel", event: PointerEvent) => {
    const point = locate(event);
    onInput({ type: "pointer", phase, x: point.x, y: point.y, id: event.pointerId });
  };

  canvas.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    ensureAudio();
    send("down", event);
  });
  canvas.addEventListener("pointermove", (event) => send("move", event));
  canvas.addEventListener("pointerup", (event) => send("up", event));
  canvas.addEventListener("pointercancel", (event) => send("cancel", event));
  canvas.addEventListener("contextmenu", (event) => event.preventDefault());
  canvas.addEventListener("touchmove", (event) => event.preventDefault(), { passive: false });

  window.addEventListener("keydown", (event) => {
    if (event.repeat) return;
    if (event.code === "KeyR" || event.code === "Digit1" || event.code === "Digit2" || event.code === "Digit3") {
      event.preventDefault();
      onInput({ type: "key", code: event.code });
    }
  });

  let audio: AudioContext | null = null;
  const ensureAudio = () => {
    if (!audio) audio = new AudioContext();
    if (audio.state === "suspended") void audio.resume();
  };

  const tone = (freq: number, dur: number, type: OscillatorType, when: number, volume: number) => {
    if (!audio) return;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, when);
    gain.gain.setValueAtTime(volume, when);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(when);
    osc.stop(when + dur);
  };

  let last = performance.now();
  const loop = (now: number) => {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, logicalW, logicalH);
    onFrame(dt);
    requestAnimationFrame(loop);
  };

  return {
    ctx,
    onInput(handler) {
      onInput = handler;
    },
    onFrame(handler) {
      onFrame = handler;
      if (!started) {
        started = true;
        requestAnimationFrame(loop);
      }
    },
    setCursor(cursor) {
      canvas.style.cursor = cursor;
    },
    play(name: SoundName) {
      try {
        ensureAudio();
        if (!audio) return;
        const now = audio.currentTime;
        if (name === "throw") tone(520, 0.08, "triangle", now, 0.045);
        else if (name === "bounce") tone(760, 0.09, "sine", now, 0.05);
        else if (name === "fail") tone(190, 0.16, "sine", now, 0.05);
        else {
          tone(523, 0.1, "triangle", now, 0.05);
          tone(659, 0.12, "triangle", now + 0.09, 0.05);
          tone(784, 0.16, "triangle", now + 0.18, 0.05);
        }
      } catch {
        // Sound is optional. The puzzle still plays muted.
      }
    },
  };
}
