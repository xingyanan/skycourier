import { font, roundRect, star } from "./drawkit";
import { WORLD, type Phase, type RenderModel, type ResultKind } from "./types";

export interface Button {
  id: "reset" | "badge" | "retry" | "next";
  x: number;
  y: number;
  w: number;
  h: number;
  shape: "rect" | "circle";
}

export const BADGE = { x: 16, y: 16, w: 52, h: 44 };
export const RESET = { cx: WORLD.width / 2, cy: 708, r: 28 };
const CARD = { x: 44, y: 220, w: 302, h: 324 };

export function failCopy(kind: ResultKind): string {
  switch (kind) {
    case "sea":
      return "掉进云海了";
    case "rest":
      return "还没投进邮箱";
    case "oob":
      return "飞出航线了";
    case "lost":
      return "包裹飞丢了";
    case "win":
      return "";
  }
}

export function buttonsFor(phase: Phase): Button[] {
  const list: Button[] = [];
  if (phase === "ready" || phase === "fail") {
    list.push({ id: "badge", ...BADGE, shape: "rect" });
  }
  if (phase === "win") {
    list.push({ id: "retry", x: CARD.x + 16, y: CARD.y + 258, w: 130, h: 48, shape: "rect" });
    list.push({ id: "next", x: CARD.x + 156, y: CARD.y + 258, w: 130, h: 48, shape: "rect" });
    return list;
  }
  list.push({
    id: "reset",
    x: RESET.cx - RESET.r,
    y: RESET.cy - RESET.r,
    w: RESET.r * 2,
    h: RESET.r * 2,
    shape: "circle",
  });
  return list;
}

export function hitButton(list: Button[], x: number, y: number): Button | null {
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const button = list[i];
    if (button.shape === "circle") {
      const cx = button.x + button.w / 2;
      const cy = button.y + button.h / 2;
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= (button.w / 2) * (button.w / 2)) return button;
    } else if (x >= button.x && y >= button.y && x <= button.x + button.w && y <= button.y + button.h) {
      return button;
    }
  }
  return null;
}

function chip(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string): void {
  ctx.save();
  ctx.fillStyle = "rgba(70, 100, 130, 0.12)";
  roundRect(ctx, x, y + 3, w, h, 14);
  ctx.fill();
  ctx.fillStyle = fill;
  roundRect(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.restore();
}

function drawStars(ctx: CanvasRenderingContext2D, cx: number, cy: number, filled: number, radius: number): void {
  for (let i = 0; i < 3; i += 1) {
    const x = cx + (i - 1) * (radius * 2.35);
    star(ctx, x, cy, radius);
    ctx.fillStyle = i < filled ? "#f2c14d" : "rgba(255,255,255,0.72)";
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = i < filled ? "#e0a428" : "rgba(120, 150, 180, 0.45)";
    ctx.stroke();
  }
}

function drawResetIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = "#3d7ec4";
  ctx.fillStyle = "#3d7ec4";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(0, 0, 9, Math.PI * 0.15, Math.PI * 1.7);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(6.2, -8.6);
  ctx.lineTo(11.2, -4.2);
  ctx.lineTo(5.4, -3.4);
  ctx.fill();
  ctx.restore();
}

function drawEnvelope(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y);
  roundRect(ctx, 0, 0, 18, 13, 2);
  ctx.fillStyle = "#f4d48a";
  ctx.fill();
  ctx.strokeStyle = "#d7a85a";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(1, 2);
  ctx.lineTo(9, 8);
  ctx.lineTo(17, 2);
  ctx.stroke();
  ctx.restore();
}

export function drawHud(ctx: CanvasRenderingContext2D, model: RenderModel): void {
  const { level } = model;
  chip(ctx, BADGE.x, BADGE.y, BADGE.w, BADGE.h, model.pressedId === "badge" ? "#ffe7bf" : "#fff6e4");
  ctx.fillStyle = "#3e6ea5";
  ctx.font = font(22, 700);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(level.id), BADGE.x + BADGE.w / 2, BADGE.y + BADGE.h / 2 + 1);

  const shownStars = model.phase === "win" ? model.winStars : 0;
  drawStars(ctx, 168, 34, shownStars, 11);
  ctx.font = font(12);
  ctx.fillStyle = "#5d7590";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(`${level.threeStarThrows} 次三星`, 168, 58);

  ctx.font = font(18, 700);
  ctx.fillStyle = "#3c5670";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  const title = "天空快递";
  ctx.fillText(title, 372, 32);
  const titleW = ctx.measureText(title).width;
  drawEnvelope(ctx, 372 - titleW - 24, 24);
  ctx.font = font(13);
  ctx.fillStyle = "#6a829c";
  ctx.fillText(level.name, 372, 54);

  ctx.font = font(13);
  ctx.textAlign = "left";
  ctx.fillStyle = "#4d6784";
  ctx.fillText(`已投 ${model.throws} 次`, 18, 84);

  if (model.phase === "aiming") {
    ctx.textAlign = "center";
    ctx.font = font(14, 700);
    ctx.fillStyle = "#3e6ea5";
    ctx.fillText(`力度 ${Math.round(model.power * 100)}%`, 250, 84);
  }

  if (model.phase === "ready" || model.phase === "aiming") {
    ctx.textAlign = "center";
    ctx.font = font(14);
    ctx.fillStyle = "#4e6882";
    ctx.fillText(level.hint[0], WORLD.width / 2, 656);
    ctx.fillText(level.hint[1], WORLD.width / 2, 676);
  }

  if (model.phase !== "win") {
    const pressed = model.pressedId === "reset";
    ctx.save();
    ctx.fillStyle = "rgba(70, 110, 150, 0.16)";
    ctx.beginPath();
    ctx.arc(RESET.cx, RESET.cy + 3, RESET.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = pressed ? "#e7f2dc" : "#ffffff";
    ctx.beginPath();
    ctx.arc(RESET.cx, RESET.cy, RESET.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#d5e4c8";
    ctx.lineWidth = 2;
    ctx.stroke();
    drawResetIcon(ctx, RESET.cx, RESET.cy);
    ctx.restore();
  }

  if (model.phase === "fail" && model.failText) {
    ctx.save();
    ctx.font = font(18, 700);
    const textW = ctx.measureText(model.failText).width;
    const w = textW + 36;
    const x = (WORLD.width - w) / 2;
    chip(ctx, x, 286, w, 48, "rgba(255,255,255,0.94)");
    ctx.fillStyle = "#3c5670";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(model.failText, WORLD.width / 2, 310);
    ctx.restore();
  }

  if (model.phase === "win") {
    ctx.save();
    ctx.fillStyle = "rgba(62, 92, 122, 0.28)";
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);
    ctx.fillStyle = "rgba(70, 100, 130, 0.14)";
    roundRect(ctx, CARD.x, CARD.y + 5, CARD.w, CARD.h, 22);
    ctx.fill();
    ctx.fillStyle = "#fffaf3";
    roundRect(ctx, CARD.x, CARD.y, CARD.w, CARD.h, 22);
    ctx.fill();
    ctx.fillStyle = "#3c5670";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = font(26, 700);
    ctx.fillText("送达成功", WORLD.width / 2, CARD.y + 48);
    drawStars(ctx, WORLD.width / 2, CARD.y + 104, model.winStars, 18);
    ctx.font = font(16);
    ctx.fillStyle = "#4d6784";
    ctx.fillText(`用了 ${model.throws} 次`, WORLD.width / 2, CARD.y + 156);
    ctx.font = font(13);
    ctx.fillText(
      `${level.threeStarThrows} 次三星 · ${level.twoStarThrows} 次二星`,
      WORLD.width / 2,
      CARD.y + 184,
    );
    if (level.stampGrantsStar) {
      ctx.fillText("同一投里接到邮票可再加 1 星", WORLD.width / 2, CARD.y + 206);
    }

    for (const button of buttonsFor("win")) {
      const pressed = model.pressedId === button.id;
      roundRect(ctx, button.x, button.y, button.w, button.h, 16);
      ctx.fillStyle = button.id === "next" ? (pressed ? "#8fce9b" : "#b7e4bf") : pressed ? "#f0d7a4" : "#ffe3b0";
      ctx.fill();
      ctx.fillStyle = "#3c5670";
      ctx.font = font(16, 700);
      const label = button.id === "retry" ? "再来一次" : model.levelIndex >= model.levelCount - 1 ? "回第一关" : "下一关";
      ctx.fillText(label, button.x + button.w / 2, button.y + button.h / 2 + 1);
    }
    ctx.restore();
  }
}
