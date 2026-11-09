import { font, hash, roundRect } from "./drawkit";
import { islandCenterX, mailboxAabb, padCircle, solidBox } from "./physics";
import { PARCEL_R, WORLD, type IslandDef, type RenderModel } from "./types";
import { drawHud } from "./ui";

function drawSky(ctx: CanvasRenderingContext2D): void {
  const sky = ctx.createLinearGradient(0, 0, 0, WORLD.height);
  sky.addColorStop(0, "#b7dcff");
  sky.addColorStop(0.45, "#d7f0ff");
  sky.addColorStop(0.78, "#f6e7ef");
  sky.addColorStop(1, "#f3d5e4");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, alpha: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale * 0.82);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(-52, 8);
  ctx.lineTo(-36, -18);
  ctx.lineTo(-14, -28);
  ctx.lineTo(6, -16);
  ctx.lineTo(28, -26);
  ctx.lineTo(48, -6);
  ctx.lineTo(36, 16);
  ctx.lineTo(-8, 18);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawCloudSea(ctx: CanvasRenderingContext2D, time: number, deathY: number): void {
  const mist = ctx.createLinearGradient(0, deathY - 90, 0, WORLD.height);
  mist.addColorStop(0, "rgba(255,255,255,0)");
  mist.addColorStop(0.35, "rgba(255,236,244,0.25)");
  mist.addColorStop(1, "rgba(244,196,214,0.72)");
  ctx.fillStyle = mist;
  ctx.fillRect(0, deathY - 90, WORLD.width, WORLD.height - (deathY - 90));

  for (let i = 0; i < 5; i += 1) {
    const drift = ((time * 12 + i * 90) % (WORLD.width + 140)) - 70;
    drawCloud(ctx, drift, deathY - 10 + (i % 2) * 18, 1.15 + (i % 3) * 0.15, 0.85);
  }
}

function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#c9854e";
  ctx.fillRect(-2, -4, 4, 10);
  ctx.fillStyle = "#6eae55";
  ctx.beginPath();
  ctx.moveTo(0, -28);
  ctx.lineTo(12, -6);
  ctx.lineTo(-12, -6);
  ctx.fill();
  ctx.fillStyle = "#8cc46e";
  ctx.beginPath();
  ctx.moveTo(0, -36);
  ctx.lineTo(9, -16);
  ctx.lineTo(-9, -16);
  ctx.fill();
  ctx.restore();
}

function drawIsland(ctx: CanvasRenderingContext2D, island: IslandDef, time: number): void {
  const x = islandCenterX(island, time);
  const top = island.y;
  const w = island.w;
  const h = island.h;

  if (island.motion) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.setLineDash([5, 6]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(island.x - island.motion.amplitude, top + 8);
    ctx.lineTo(island.x + island.motion.amplitude, top + 8);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x - w * 0.48, top + 10);
  ctx.lineTo(x - w * 0.34, top + h);
  ctx.lineTo(x + w * 0.3, top + h * 0.94);
  ctx.lineTo(x + w * 0.5, top + 8);
  ctx.closePath();
  ctx.fillStyle = island.solid ? "#8b93a6" : "#a9b3c4";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x - w * 0.02, top + 12);
  ctx.lineTo(x + w * 0.02, top + h * 0.9);
  ctx.lineTo(x + w * 0.3, top + h * 0.94);
  ctx.lineTo(x + w * 0.5, top + 8);
  ctx.closePath();
  ctx.fillStyle = island.solid ? "#727b8e" : "#95a0b2";
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(x, top + 2, w * 0.5, 16, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#8fcd5c";
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x, top - 1, w * 0.4, 10, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#b6e07a";
  ctx.fill();

  const flowers = island.flowers ?? 0;
  for (let i = 0; i < flowers; i += 1) {
    const seed = hash(island.x * 0.17 + island.y + i * 19);
    const fx = x - w * 0.32 + seed * w * 0.64;
    const colors = ["#fffdf8", "#ffd0e0", "#ffe38a"];
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.arc(fx, top - 2, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  const trees = island.trees ?? 0;
  for (let i = 0; i < trees; i += 1) {
    const seed = hash(island.y * 0.3 + i * 13 + island.w);
    const tx = x - w * 0.22 + seed * w * 0.44;
    drawTree(ctx, tx, top, 0.72 + seed * 0.35);
  }
  ctx.restore();
}

function drawPad(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, time: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(126, 104, 196, 0.18)";
  ctx.beginPath();
  ctx.ellipse(0, 8, r * 0.72, r * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.92, r * 0.62, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#b7a4f2";
  ctx.fill();
  ctx.strokeStyle = "#8d78d8";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.62, r * 0.38, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#d5c8ff";
  ctx.fill();

  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = "#ffffff";
  ctx.lineWidth = 2.4;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const bob = Math.sin(time * 5) * 2;
  for (let i = 0; i < 3; i += 1) {
    const yy = -r * 0.95 - i * 8 + bob;
    ctx.beginPath();
    ctx.moveTo(-7, yy + 5);
    ctx.lineTo(0, yy);
    ctx.lineTo(7, yy + 5);
    ctx.stroke();
  }
  ctx.restore();
}

function drawMailbox(ctx: CanvasRenderingContext2D, levelTime: number, model: RenderModel): void {
  const slot = mailboxAabb(model.level, levelTime);
  const boxW = slot.right - slot.left + 18;
  const boxH = slot.bottom - slot.top + 16;
  const boxX = slot.cx - boxW / 2;
  const boxY = slot.top - 8;

  ctx.save();
  ctx.fillStyle = "#c9854e";
  ctx.fillRect(slot.cx - 3, slot.bottom - 2, 6, model.level.islands.find((i) => i.id === model.level.mailbox.islandId)!.y - slot.bottom + 6);

  roundRect(ctx, boxX, boxY, boxW, boxH, 6);
  ctx.fillStyle = "#6aa6e4";
  ctx.fill();
  ctx.strokeStyle = "#4d86c4";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#3c628f";
  roundRect(ctx, slot.left, slot.top, slot.right - slot.left, slot.bottom - slot.top, 4);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = font(11, 700);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("✉", slot.cx, (slot.top + slot.bottom) / 2);

  const wave = Math.sin(model.animTime * 3) * 0.25;
  ctx.translate(slot.right + 2, slot.top + 2);
  ctx.fillStyle = "#8d6a45";
  ctx.fillRect(0, 0, 3, 8);
  ctx.rotate(wave);
  ctx.beginPath();
  ctx.moveTo(3, 0);
  ctx.lineTo(18, 4);
  ctx.lineTo(3, 8);
  ctx.fillStyle = "#4c78d4";
  ctx.fill();
  ctx.restore();
}

function drawFox(ctx: CanvasRenderingContext2D, x: number, y: number, time: number): void {
  const blink = Math.sin(time * 2.1) > 0.97;
  ctx.save();
  ctx.translate(x, y - 10);
  ctx.scale(1.05, 1.05);

  ctx.fillStyle = "#e07a32";
  ctx.beginPath();
  ctx.ellipse(-40, 8, 16, 10, -0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff6ea";
  ctx.beginPath();
  ctx.ellipse(-52, 4, 7, 6, -0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f0923c";
  ctx.beginPath();
  ctx.ellipse(-22, 6, 16, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff4e6";
  ctx.beginPath();
  ctx.ellipse(-20, 15, 11, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#e07d34";
  roundRect(ctx, -32, 16, 7, 10, 2);
  ctx.fill();
  roundRect(ctx, -16, 16, 7, 10, 2);
  ctx.fill();

  ctx.fillStyle = "#f39a45";
  ctx.beginPath();
  ctx.arc(-6, -4, 13, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f0923c";
  ctx.beginPath();
  ctx.moveTo(-16, -12);
  ctx.lineTo(-20, -28);
  ctx.lineTo(-6, -14);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(2, -14);
  ctx.lineTo(8, -30);
  ctx.lineTo(10, -10);
  ctx.fill();
  ctx.fillStyle = "#f6c2b4";
  ctx.beginPath();
  ctx.moveTo(-15, -14);
  ctx.lineTo(-17, -24);
  ctx.lineTo(-8, -14);
  ctx.fill();

  ctx.fillStyle = "#fff8f0";
  ctx.beginPath();
  ctx.ellipse(-2, 2, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#2c241f";
  if (!blink) {
    ctx.beginPath();
    ctx.arc(-10, -6, 1.6, 0, Math.PI * 2);
    ctx.arc(-2, -6, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(-9.4, -6.6, 0.6, 0, Math.PI * 2);
    ctx.arc(-1.4, -6.6, 0.6, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = "#2c241f";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-12, -6);
    ctx.lineTo(-8, -6);
    ctx.moveTo(-4, -6);
    ctx.lineTo(0, -6);
    ctx.stroke();
  }

  ctx.fillStyle = "#3a2a24";
  ctx.beginPath();
  ctx.arc(-5, 1, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#6eb6e6";
  ctx.beginPath();
  ctx.ellipse(-10, 8, 10, 4.5, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-8, 8, 5, 11);

  ctx.fillStyle = "#c4894e";
  roundRect(ctx, -30, 6, 12, 10, 2);
  ctx.fill();
  ctx.strokeStyle = "#8d6234";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function drawParcel(ctx: CanvasRenderingContext2D, x: number, y: number, rot: number): void {
  ctx.save();
  ctx.translate(x, y);
  roundRect(ctx, -9, -5, 22, 16, 3);
  ctx.fillStyle = "rgba(80, 60, 40, 0.15)";
  ctx.fill();
  ctx.rotate(rot);
  roundRect(ctx, -11, -8, 22, 16, 3);
  ctx.fillStyle = "#e2b56a";
  ctx.fill();
  ctx.strokeStyle = "#b88843";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.strokeStyle = "#f6e6c4";
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(0, 8);
  ctx.moveTo(-11, 0);
  ctx.lineTo(11, 0);
  ctx.stroke();
  ctx.restore();
}

function drawWind(ctx: CanvasRenderingContext2D, model: RenderModel): void {
  const wind = model.level.wind;
  if (Math.abs(wind) < 1) return;
  const dir = Math.sign(wind);
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  for (let i = 0; i < 7; i += 1) {
    const span = 28 + (i % 3) * 10;
    const base = ((model.animTime * 46 * dir + i * 70) % (WORLD.width + 80)) - 40;
    const x = dir > 0 ? base : WORLD.width - base;
    const y = 110 + ((i * 47) % 220);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dir * span, y + Math.sin(i + model.animTime) * 2);
    ctx.stroke();
  }

  const launch = model.level.islands.find((island) => island.id === "launch");
  const poleX = launch ? islandCenterX(launch, sceneTime(model)) - (launch.w * 0.28) : model.level.launch.x - 36;
  const poleY = launch ? launch.y : model.level.launch.y + 16;
  ctx.strokeStyle = "#c9854e";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(poleX, poleY);
  ctx.lineTo(poleX, poleY - 42);
  ctx.stroke();
  ctx.fillStyle = "#ef6d6d";
  ctx.beginPath();
  ctx.moveTo(poleX, poleY - 42);
  ctx.lineTo(poleX + dir * 22, poleY - 34);
  ctx.lineTo(poleX, poleY - 26);
  ctx.fill();
  ctx.restore();
}

function sceneTime(model: RenderModel): number {
  if (model.phase === "flying" || model.phase === "fail" || model.phase === "win") return model.sim.time;
  return model.worldTime;
}

function parcelPose(model: RenderModel): { x: number; y: number; rot: number } {
  const launch = model.level.launch;
  if (model.phase === "aiming" && model.pull) {
    return {
      x: launch.x + model.pull.x,
      y: launch.y + model.pull.y,
      rot: Math.atan2(model.pull.y, model.pull.x) * 0.2,
    };
  }
  if (model.phase === "flying" || model.phase === "fail" || model.phase === "win") {
    const speed = Math.hypot(model.sim.body.vx, model.sim.body.vy);
    const rot = speed > 40 ? Math.atan2(model.sim.body.vy, model.sim.body.vx) : 0;
    return { x: model.sim.body.x, y: model.sim.body.y, rot };
  }
  return { x: launch.x, y: launch.y, rot: -0.08 };
}

export function render(ctx: CanvasRenderingContext2D, model: RenderModel, debug: boolean): void {
  const time = sceneTime(model);
  drawSky(ctx);

  for (let i = 0; i < 4; i += 1) {
    const drift = ((model.animTime * 8 + i * 120) % (WORLD.width + 180)) - 80;
    drawCloud(ctx, drift, 78 + i * 36, 0.85 + (i % 2) * 0.25, 0.95);
  }

  drawCloudSea(ctx, model.animTime, model.level.deathY);

  const islands = [...model.level.islands].sort((a, b) => a.y - b.y);
  for (const island of islands) drawIsland(ctx, island, time);

  model.level.pads.forEach((_, index) => {
    const pad = padCircle(model.level, index, time);
    drawPad(ctx, pad.x, pad.y, pad.r, model.animTime);
  });

  drawMailbox(ctx, time, model);
  drawWind(ctx, model);

  model.level.stamps.forEach((stamp, index) => {
    if (model.sim.stamps[index]) return;
    ctx.save();
    ctx.translate(stamp.x, stamp.y + Math.sin(model.animTime * 3 + index) * 3);
    ctx.rotate(-0.2);
    roundRect(ctx, -11, -13, 22, 26, 3);
    ctx.fillStyle = "#fff7ea";
    ctx.fill();
    ctx.strokeStyle = "#e0b15a";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#d24b4b";
    ctx.font = font(12, 700);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("票", 0, 0);
    ctx.restore();
  });

  if (model.preview) {
    const drawDots = (points: { x: number; y: number }[], strong: boolean) => {
      points.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, strong ? 3.3 : 2.4, 0, Math.PI * 2);
        ctx.fillStyle = strong ? "rgba(255,255,255,0.95)" : "rgba(255,120,120,0.35)";
        ctx.fill();
        if (strong) {
          ctx.strokeStyle = "rgba(90,140,190,0.35)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });
    };
    drawDots(model.preview.shown, true);
    if (debug) drawDots(model.preview.rest, false);
  }

  drawFox(ctx, model.level.launch.x, model.level.launch.y, model.animTime);

  const pose = parcelPose(model);
  if (model.phase === "aiming" && model.pull) {
    ctx.save();
    ctx.strokeStyle = "rgba(120, 84, 62, 0.55)";
    ctx.lineWidth = 2;
    for (const pegY of [-7, 7]) {
      ctx.beginPath();
      ctx.moveTo(model.level.launch.x - 4, model.level.launch.y + pegY);
      ctx.lineTo(pose.x, pose.y);
      ctx.stroke();
    }
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.arc(model.level.launch.x, model.level.launch.y, model.level.launch.maxPull, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  for (const particle of model.particles) {
    ctx.globalAlpha = Math.max(0, particle.life / particle.max);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  drawParcel(ctx, pose.x, pose.y, pose.rot);

  if (model.phase === "ready" && model.throws === 0) {
    const pulse = 0.45 + Math.sin(model.animTime * 4) * 0.25;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = "#ffffff";
    ctx.fillStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pose.x - 18, pose.y + 8);
    ctx.lineTo(pose.x - 42, pose.y + 28);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pose.x - 42, pose.y + 28);
    ctx.lineTo(pose.x - 36, pose.y + 16);
    ctx.lineTo(pose.x - 28, pose.y + 26);
    ctx.fill();
    ctx.restore();
  }

  if (debug) {
    ctx.save();
    ctx.strokeStyle = "rgba(220, 60, 60, 0.8)";
    ctx.lineWidth = 1;
    for (const island of model.level.islands) {
      if (!island.solid) continue;
      const box = solidBox(island, time);
      ctx.strokeRect(box.left, box.top, box.right - box.left, box.bottom - box.top);
    }
    model.level.pads.forEach((_, index) => {
      const pad = padCircle(model.level, index, time);
      ctx.beginPath();
      ctx.arc(pad.x, pad.y, pad.r + PARCEL_R, 0, Math.PI * 2);
      ctx.stroke();
    });
    const slot = mailboxAabb(model.level, time);
    ctx.strokeStyle = "rgba(40, 80, 220, 0.9)";
    ctx.strokeRect(slot.left, slot.top, slot.right - slot.left, slot.bottom - slot.top);
    ctx.strokeStyle = "rgba(180, 40, 80, 0.7)";
    ctx.beginPath();
    ctx.moveTo(0, model.level.deathY);
    ctx.lineTo(WORLD.width, model.level.deathY);
    ctx.stroke();
    ctx.restore();
  }

  drawHud(ctx, model);
}
