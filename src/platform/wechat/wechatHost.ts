import type { InputEvent } from "../../game/types";
import type { GameHost } from "../types";

/**
 * 微信小游戏移植缝。浏览器构建不会引用这个文件。
 * 还没在微信开发者工具里跑过，只把触摸和画布收成 GameHost：
 * 游戏逻辑继续用 390×780 逻辑坐标，不碰 document。
 */

interface WxTouch {
  clientX: number;
  clientY: number;
  identifier: number;
}

interface WxTouchEvent {
  changedTouches: WxTouch[];
}

interface WxCanvas {
  width: number;
  height: number;
  getContext(kind: "2d"): CanvasRenderingContext2D;
}

interface WxApi {
  createCanvas(): WxCanvas;
  getSystemInfoSync(): { windowWidth: number; windowHeight: number; pixelRatio: number };
  onTouchStart(handler: (event: WxTouchEvent) => void): void;
  onTouchMove(handler: (event: WxTouchEvent) => void): void;
  onTouchEnd(handler: (event: WxTouchEvent) => void): void;
  onTouchCancel(handler: (event: WxTouchEvent) => void): void;
}

declare const wx: WxApi;

export function createWechatHost(logicalW: number, logicalH: number): GameHost {
  const info = wx.getSystemInfoSync();
  const dpr = Math.min(info.pixelRatio || 1, 2);
  const scale = Math.min(info.windowWidth / logicalW, info.windowHeight / logicalH);
  const offsetX = (info.windowWidth - logicalW * scale) / 2;
  const offsetY = (info.windowHeight - logicalH * scale) / 2;
  const canvas = wx.createCanvas();
  canvas.width = Math.max(1, Math.round(info.windowWidth * dpr));
  canvas.height = Math.max(1, Math.round(info.windowHeight * dpr));
  const ctx = canvas.getContext("2d");

  const applyCamera = () => {
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, offsetX * dpr, offsetY * dpr);
  };
  applyCamera();

  let onInput: (event: InputEvent) => void = () => {};
  let onFrame: (dt: number) => void = () => {};
  let started = false;

  const send = (phase: "down" | "move" | "up" | "cancel", event: WxTouchEvent) => {
    for (const touch of event.changedTouches) {
      onInput({
        type: "pointer",
        phase,
        x: (touch.clientX - offsetX) / scale,
        y: (touch.clientY - offsetY) / scale,
        id: touch.identifier,
      });
    }
  };

  wx.onTouchStart((event) => send("down", event));
  wx.onTouchMove((event) => send("move", event));
  wx.onTouchEnd((event) => send("up", event));
  wx.onTouchCancel((event) => send("cancel", event));

  let last = Date.now();
  const loop = () => {
    const now = Date.now();
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    applyCamera();
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
    setCursor() {
      // 微信小游戏没有鼠标指针。
    },
    play() {
      // 音效以后可以接到 wx.createInnerAudioContext。
    },
  };
}
