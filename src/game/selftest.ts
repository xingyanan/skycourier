import { createSession } from "./game";
import { levels } from "./levels";
import { createSim, previewPaths, stepSim } from "./physics";
import { rateStars } from "./score";
import { assessLevels, pullForShot, type Recipe } from "./solver";
import { buttonsFor } from "./ui";

function play(recipe: Recipe): string | null {
  const session = createSession();
  session.loadLevel(recipe.levelIndex);
  const level = levels[recipe.levelIndex];
  const dt = 1 / 120;
  let guard = 0;
  while (session.getState().worldTime + 1e-4 < recipe.time0 && guard < 2000) {
    session.update(dt);
    guard += 1;
  }
  const pull = pullForShot(level, recipe.angle, recipe.power);
  const at = (phase: "down" | "move" | "up", x: number, y: number) => {
    session.pointer({ type: "pointer", phase, x, y, id: 1 });
  };
  at("down", level.launch.x, level.launch.y);
  at("move", level.launch.x + pull.x, level.launch.y + pull.y);
  const aiming = session.getState();
  if (aiming.phase !== "aiming" || aiming.previewShown < 3 || aiming.previewRest < 3) {
    return `第${level.id}关瞄准预览不对 shown=${aiming.previewShown} rest=${aiming.previewRest}`;
  }
  at("up", level.launch.x + pull.x, level.launch.y + pull.y);
  if (session.getState().throws !== 1 || session.getState().phase !== "flying") {
    return `第${level.id}关松手后没有进入飞行`;
  }
  guard = 0;
  while (session.getState().phase === "flying" && guard < 700) {
    session.update(dt);
    guard += 1;
  }
  const end = session.getState();
  if (end.phase !== "win" || end.stars !== 3) {
    return `第${level.id}关回放没有三星送达，phase=${end.phase} result=${end.result} stars=${end.stars} pos=${end.x.toFixed(0)},${end.y.toFixed(0)}`;
  }
  if (recipe.bounces > 0 && end.bounceCount < 1) return `第${level.id}关回放没有打中弹板`;

  const retry = buttonsFor("win").find((button) => button.id === "retry");
  if (!retry) return "胜利界面缺少重来按钮";
  at("down", retry.x + retry.w / 2, retry.y + retry.h / 2);
  at("up", retry.x + retry.w / 2, retry.y + retry.h / 2);
  const again = session.getState();
  if (again.phase !== "ready" || again.throws !== 0 || again.levelIndex !== recipe.levelIndex) {
    return `第${level.id}关再来一次没有清空`;
  }
  return null;
}

function playMiss(): string | null {
  const session = createSession();
  const level = levels[0];
  const at = (phase: "down" | "move" | "up", x: number, y: number) => {
    session.pointer({ type: "pointer", phase, x, y, id: 1 });
  };
  at("down", level.launch.x, level.launch.y);
  at("move", level.launch.x + 72, level.launch.y);
  at("up", level.launch.x + 72, level.launch.y);
  const dt = 1 / 120;
  let guard = 0;
  while (session.getState().phase === "flying" && guard < 700) {
    session.update(dt);
    guard += 1;
  }
  if (session.getState().phase !== "fail" || session.getState().throws !== 1) {
    return `向左投出应该失败，实际 phase=${session.getState().phase} throws=${session.getState().throws}`;
  }
  guard = 0;
  while (session.getState().phase === "fail" && guard < 120) {
    session.update(dt);
    guard += 1;
  }
  if (session.getState().phase !== "ready" || session.getState().throws !== 1) {
    return "失败后没有带着次数回到可瞄准";
  }
  session.pointer({ type: "key", code: "KeyR" });
  if (session.getState().throws !== 0 || session.getState().phase !== "ready") return "重开没有清空次数";

  const badge = buttonsFor("ready").find((button) => button.id === "badge");
  if (!badge) return "缺少关卡按钮";
  at("down", badge.x + badge.w / 2, badge.y + badge.h / 2);
  at("up", badge.x + badge.w / 2, badge.y + badge.h / 2);
  if (session.getState().levelIndex !== 1) return "点击关卡数字没有切到下一关";
  session.pointer({ type: "key", code: "Digit1" });
  if (session.getState().levelIndex !== 0) return "数字键 1 没有回到第一关";
  return null;
}

function playStamp(): string | null {
  const level = {
    ...levels[0],
    stampGrantsStar: true,
    stamps: [{ x: levels[0].launch.x + 36, y: levels[0].launch.y, r: 16 }],
  };
  const sim = createSim(level, 0);
  sim.body.vx = 420;
  sim.body.vy = 0;
  for (let i = 0; i < 40 && !sim.stamps[0]; i += 1) stepSim(level, sim, 1 / 120);
  if (!sim.stamps[0]) return "邮票没有被飞过的包裹收集";
  if (rateStars(level, 2, 1) !== 3) return "邮票没有把二星加成三星";
  if (rateStars(level, 2, 0) !== 2) return "没接到邮票时星级算错了";
  if (rateStars(level, 1, 1) !== 3) return "三星不该被邮票抬过 3";
  if (rateStars(levels[0], 2, 1) !== 2) return "未开启邮票加星的关卡不该加星";
  const hidden = previewPaths(level, 500, -200, 0);
  if (hidden.shown.length < 3 || hidden.rest.length < 3) return "轨迹预览没有只公开前半段";
  return null;
}

export function runSelfTest(): { ok: boolean; report: string } {
  const lines: string[] = [];
  let ok = true;
  try {
    const assessed = assessLevels();
    lines.push(assessed.report);
    if (!assessed.ok) ok = false;
    if (assessed.recipes.length < levels.length) {
      ok = false;
      lines.push("有关卡找不到可回放的解。");
    }
    for (const recipe of assessed.recipes) {
      const problem = play(recipe);
      if (problem) {
        ok = false;
        lines.push(problem);
      } else {
        lines.push(`第${recipe.levelIndex + 1}关回放送达。`);
      }
    }
    for (const problem of [playMiss(), playStamp()]) {
      if (problem) {
        ok = false;
        lines.push(problem);
      }
    }
    if (ok) lines.push("操作、失败重投、星级和半截轨迹都对得上。");
  } catch (error) {
    ok = false;
    lines.push(error instanceof Error ? (error.stack ?? error.message) : String(error));
  }
  return { ok, report: lines.join("\n") };
}
